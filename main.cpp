#include <arpa/inet.h>
#include <cstdlib>
#include <iostream>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <thread>
#include <type_traits>
#include <unistd.h>
#include <vector>
#include <algorithm>
#include <mutex>

const int BUFFER_SIZE = 4096;

std::vector<std::thread*> runningWorkers;
std::mutex runningWorkerMutex;

void cleanWorkers() {
  runningWorkers.erase(std::remove_if(begin(runningWorkers), end(runningWorkers), [](std::thread* worker) {
    return !worker->joinable();
  }), end(runningWorkers));
}

// Modified from https://github.com/toprakkeskin/Cpp-Socket-Simple-TCP-Echo-Server-Client/blob/master/server/tcp-echo-server-main.cpp
int serveTCP(int listenPort) {
  int server_socket = socket(AF_INET, SOCK_STREAM, 0);

  if (server_socket < 0) {
    std::cerr << "[TCP] Socket cannot be created!\n";
    return -2;
  }

  sockaddr_in server_addr;
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(listenPort);

  inet_pton(AF_INET, "0.0.0.0", &server_addr.sin_addr);

  if (bind(server_socket, (sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
    std::cerr << "[TCP] Could not bind socket\n";
    return -3;
  }

  if (listen(server_socket, SOMAXCONN) < 0) {
    std::cerr << "[TCP] Socket cannot be switched to listen mode!\n";
    return -4;
  }

  std::cout << "[TCP] Socket is listening on " << listenPort << "\n";

  while (true) {
    sockaddr_in client_addr;
    socklen_t client_addr_size = sizeof(client_addr);
    int client_socket;
    if ((client_socket = accept(server_socket, (sockaddr*)&client_addr, &client_addr_size)) < 0) {
      std::cerr << "[TCP] Connections cannot be accepted for a reason.\n";
      return -5;
    }

    std::cout << "[TCP] A connection is accepted now.\n";

    std::thread *worker = new std::thread([client_addr, client_addr_size, client_socket](){
      char *hostaddrp = inet_ntoa(client_addr.sin_addr);
      if (hostaddrp == NULL) {
        std::cerr << "[TCP] Failed on inet_ntoa.\n";
      }

      std::cout << "[TCP] " << hostaddrp << ":" << client_addr.sin_port << " connected...\n";

      char buffer[BUFFER_SIZE];
      int bytes;

      while (true) {
        bytes = recv(client_socket, &buffer, BUFFER_SIZE, 0);

        if (bytes == 0) {
          std::cout << "[TCP] Client is disconnected.\n";
          break;
        } else if (bytes < 0) {
          std::cerr << "[TCP] Something went wrong while receiving data!.\n";
          break;
        } else {
          std::cout << "[TCP] Received " << bytes << " bytes from " << hostaddrp << ":" << client_addr.sin_port << "\n";

          if (send(client_socket, &buffer, bytes, 0) < 0) {
            std::cerr << "[TCP] Message cannot be send, exiting...\n";
            break;
          }
        }
      }

      close(client_socket);
      std::cout << "[TCP] " << hostaddrp << ":" << client_addr.sin_port << " disconnected.\n";
    });

    runningWorkerMutex.lock();
    runningWorkers.push_back(worker);
    cleanWorkers();
    runningWorkerMutex.unlock();
  }

  close(server_socket);
  std::cout << "[TCP] Main listener socket is closed.\n";

  return 0;
}

// Modified from https://gist.github.com/suyash/0f100b1518334fcf650bbefd54556df9
int serveUDP(int listenPort) {
	struct sockaddr_in server_addr;
	memset(&server_addr, 0, sizeof(server_addr));
	server_addr.sin_family = AF_INET;
	server_addr.sin_port = htons(listenPort);
	server_addr.sin_addr.s_addr = htonl(INADDR_ANY);

	int server_socket;
	if ((server_socket = socket(PF_INET, SOCK_DGRAM, 0)) < 0) {
    std::cerr << "[UDP] Could not create socket\n";
		return 1;
	}

	if ((bind(server_socket, (struct sockaddr *)&server_addr,
	          sizeof(server_addr))) < 0) {
    std::cerr << "[UDP] Could not bind socket\n";
		return 1;
	}

  std::cout << "[UDP] Socket is listening on " << listenPort << "\n";

	struct sockaddr_in client_address;
	socklen_t client_address_len = sizeof(client_address);

	while (true) {
    char *hostaddrp = inet_ntoa(client_address.sin_addr);
    if (hostaddrp == NULL) {
      std::cerr << "[UDP] Failed on inet_ntoa.\n";
    }

		char buffer[BUFFER_SIZE];
		int bytes = recvfrom(server_socket, buffer, sizeof(buffer), 0,
		                   (struct sockaddr *)&client_address,
		                   &client_address_len);

    std::cout << "[UDP] Received " << bytes << " bytes from " << hostaddrp << ":" << client_address.sin_port << "\n";

		sendto(server_socket, buffer, bytes, 0, (struct sockaddr *)&client_address, sizeof(client_address));
	}

	return 0;
}

// Modified from https://gist.github.com/bdahlia/7826649
int serveHTTP(int listenPort) {
  int server_socket;
  int client_socket;

  struct sockaddr_in server_addr;
  struct sockaddr_in client_addr;

  server_socket = socket(AF_INET, SOCK_STREAM, 0);
  if (server_socket < 0) {
    std::cerr << "[HTTP] Opening socket failed.\n";
    return 1;
  }

  int optval = 1;
  setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, (const void *)&optval , sizeof(int));

  bzero((char *) &server_addr, sizeof(server_addr));
  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  server_addr.sin_port = htons(listenPort);
  if (bind(server_socket, (struct sockaddr *) &server_addr,
            sizeof(server_addr)) < 0) {
    std::cerr << "[HTTP] Bind socket failed\n";
    return 1;
  }

  if (listen(server_socket, SOMAXCONN) < 0) {
    std::cerr << "[HTTP] Listen socket failed\n";
    return 1;
  }

  std::cout << "[HTTP] Socket is listening on " << listenPort << "\n";

  socklen_t clientlen = sizeof(client_addr);

  while (true) {
      client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &clientlen);
      if (client_socket < 0) {
        std::cerr << "[HTTP] Accept client socket failed.\n";
        continue;
      }

      std::thread *worker = new std::thread([client_addr, client_socket]() {
        const char* helloResponse = "HTTP/1.1 200 OK\n\nHello\n";
        const char* notFoundResponse = "HTTP/1.1 404 Not Found\n\nNot Found\n";

        char *hostaddrp = inet_ntoa(client_addr.sin_addr);
        if (hostaddrp == NULL) {
          std::cerr << "[HTTP] Failed on inet_ntoa.\n";
        }

        std::cout << "[HTTP] Received request from " << hostaddrp << ":" << client_addr.sin_port << "\n";

        char buffer[BUFFER_SIZE];
        int bytes = recv(client_socket, &buffer, sizeof(buffer), 0);
        int sentBytes;

        std::this_thread::sleep_for(std::chrono::milliseconds(rand() % 1000));

        if (!strncmp(buffer, "GET / ", 6)) {
          sentBytes = send(client_socket, helloResponse, strlen(helloResponse), 0);
        } else {
          sentBytes = send(client_socket, notFoundResponse, strlen(notFoundResponse), 0);
        }

        if (sentBytes < 0) {
          std::cerr << "[HTTP] Send response failed\n";
        }

        close(client_socket);
      });

      runningWorkerMutex.lock();
      runningWorkers.push_back(worker);
      cleanWorkers();
      runningWorkerMutex.unlock();
  }

  return 0;
}

void signalHandler(int signalNumber) {
  std::cerr << "[SIGNAL] Received " << signalNumber << "\n";

  runningWorkerMutex.lock();

  cleanWorkers();

  std::cerr << "[SIGNAL] " << runningWorkers.size() << " workers are running, wait for them ...\n";

  for (auto &worker : runningWorkers) {
    worker->join();
  }

  exit(0);
}

int main(int argc, char **argv) {
  srand(time(nullptr));

  std::thread threadTcp(serveTCP, 4000);
  std::thread threadUdp(serveUDP, 4000);
  std::thread threadHTTP(serveHTTP, 3000);

  signal(SIGTERM, signalHandler);
  signal(SIGINT, signalHandler);

  threadTcp.join();
  threadUdp.join();
  threadHTTP.join();

  return 0;
}
