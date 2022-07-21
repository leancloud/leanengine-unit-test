package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
)

func httpServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello")
	})

	http.ListenAndServe(":3000", nil)
}

func factorio() {
	if err := os.Chmod("./bin/x64/factorio", 0755); err != nil {
		fmt.Println(err)
	}

	saveName, exists := os.LookupEnv("SAVE_NAME")

	if !exists {
		saveName = "big-mesh"
	}

	saveFile := "../cache/saves/" + saveName + ".zip"

	if _, err := os.Stat(saveFile); errors.Is(err, os.ErrNotExist) {
		err := os.MkdirAll("../cache/saves", os.ModePerm)

		bytesRead, err := ioutil.ReadFile("./saves/" + saveName + ".zip")

		if err != nil {
			fmt.Println(err)
		}

		err = ioutil.WriteFile(saveFile, bytesRead, 0644)

		if err != nil {
			fmt.Println(err)
		}
	}

	cmd := exec.Command("./bin/x64/factorio", "--start-server", saveFile, "--port", "4000")

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println(cmd.Run())
}

func main() {
	go factorio()

	httpServer()
}
