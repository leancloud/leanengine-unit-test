package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
)

func httpServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello")
	})

	http.ListenAndServe(":3000", nil)
}

func main() {
	saveName, exists := os.LookupEnv("SAVE_NAME")
	rcloneRemote := os.Getenv("RCLONE_REMOTE")

	if !exists {
		saveName = "first-game"
	}

	saveFile := "./saves/" + saveName + ".zip"

	createNewSave := func() {
		stdout, err := exec.Command("./bin/x64/factorio", "--create", saveFile).Output()

		fmt.Println(stdout)

		if err != nil {
			fmt.Fprintln(os.Stderr, err)
		}
	}

	startFactorio := func() {
		cmd := exec.Command("./bin/x64/factorio", "--start-server", saveFile, "--port", "34197")

		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		fmt.Println(cmd.Run())
	}

	startRcloneSync := func() {
		watcher, err := fsnotify.NewWatcher()

		if err != nil {
			fmt.Fprintln(os.Stderr, err)
		}

		defer watcher.Close()

		if err := watcher.Add(filepath.Dir(saveFile)); err != nil {
			fmt.Fprintln(os.Stderr, err)
		}

		for {
			select {
			case e := <-watcher.Events:
				if !strings.HasSuffix(e.Name, ".tmp.zip") && !strings.HasSuffix(e.Name, ".bak.zip") {
					fmt.Println("Uploading", e.Name, "to S3 ...")

					cmd := exec.Command("./rclone", "copy", filepath.Dir(saveFile), rcloneRemote)

					cmd.Stdout = os.Stdout
					cmd.Stderr = os.Stderr

					fmt.Println(cmd.Run())
				}

			case err := <-watcher.Errors:
				fmt.Fprintln(os.Stderr, err)
			}
		}
	}

	fmt.Println("Downloading", saveFile, "from S3 ...")
	stdout, err := exec.Command("./rclone", "copy", fmt.Sprint(rcloneRemote, "/", saveName, ".zip"), filepath.Dir(saveFile)).Output()

	fmt.Println(stdout)

	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}

	if _, err := os.Stat(saveFile); errors.Is(err, os.ErrNotExist) {
		fmt.Println("Creating new sav ", saveFile, "...")
		createNewSave()
	}

	go startFactorio()
	go startRcloneSync()

	httpServer()
}
