#include <arpa/inet.h>
#include <cstdlib>
#include <fcntl.h>
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

std::vector<std::thread*> runningWorkerThreads;
std::mutex runningWorkerMutex;

void cleanWorkerThreads() {
  runningWorkerThreads.erase(std::remove_if(begin(runningWorkerThreads), end(runningWorkerThreads), [](std::thread* worker) {
    return !worker->joinable();
  }), end(runningWorkerThreads));
}

// Modified from https://github.com/toprakkeskin/Cpp-Socket-Simple-TCP-Echo-Server-Client/blob/master/server/tcp-echo-server-main.cpp
int serveTCP(int listenPort) {
  int slistener = socket(AF_INET, SOCK_STREAM, 0);

  if (slistener < 0) {
    std::cerr << "[TCP] Socket cannot be created!\n";
    return -2;
  }

  sockaddr_in saddr;
  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(listenPort);

  inet_pton(AF_INET, "0.0.0.0", &saddr.sin_addr);

  char buf[INET_ADDRSTRLEN];

  if (bind(slistener, (sockaddr *)&saddr, sizeof(saddr)) < 0) {
    std::cerr << "[TCP] Created socket cannot be binded to ("
              << inet_ntop(AF_INET, &saddr.sin_addr, buf, INET_ADDRSTRLEN)
              << ":" << ntohs(saddr.sin_port) << ")\n";
    return -3;
  }

  if (listen(slistener, SOMAXCONN) < 0) {
    std::cerr << "[TCP] Socket cannot be switched to listen mode!\n";
    return -4;
  }

  std::cout << "[TCP] Socket is listening on "
            << inet_ntop(AF_INET, &saddr.sin_addr, buf, INET_ADDRSTRLEN)
            << ":" << ntohs(saddr.sin_port) << "\n";

  while (true) {
    sockaddr_in client_addr;
    socklen_t client_addr_size = sizeof(client_addr);
    int sock_client;
    if ((sock_client = accept(slistener, (sockaddr*)&client_addr, &client_addr_size)) < 0) {
      std::cerr << "[TCP] Connections cannot be accepted for a reason.\n";
      return -5;
    }

    std::cout << "[TCP] A connection is accepted now.\n";

    std::thread *worker = new std::thread([client_addr, client_addr_size, buf, sock_client](){
      char host[NI_MAXHOST];
      char svc[NI_MAXSERV];
      if (getnameinfo(
            (sockaddr*)&client_addr, client_addr_size,
            host, NI_MAXHOST,
            svc, NI_MAXSERV, 0) != 0) {
        std::cout << "[TCP] Client: (" << inet_ntop(AF_INET, &client_addr.sin_addr, (char*)buf, INET_ADDRSTRLEN)
                  << ":" << ntohs(client_addr.sin_port) << ")\n";
      } else {
        std::cout << "[TCP] Client: (host: " << host << ", service: " << svc << ")\n";
      }

      char buffer[BUFFER_SIZE];
      int bytes;

      while (true) {
        bytes = recv(sock_client, &buffer, BUFFER_SIZE, 0);

        if (bytes == 0) {
          std::cout << "[TCP] Client is disconnected.\n";
          break;
        } else if (bytes < 0) {
          std::cerr << "[TCP] Something went wrong while receiving data!.\n";
          break;
        } else {
          std::cout << "[TCP] Recevied " << bytes << " bytes of data\n";

          std::this_thread::sleep_for(std::chrono::milliseconds(rand() % 1000));

          if (send(sock_client, &buffer, bytes, 0) < 0) {
            std::cerr << "[TCP] Message cannot be send, exiting...\n";
            break;
          }
        }
      }

      close(sock_client);
      std::cout << "[TCP] Client socket is closed.\n";
    });

    runningWorkerMutex.lock();
    runningWorkerThreads.push_back(worker);
    cleanWorkerThreads();
    runningWorkerMutex.unlock();
  }

  close(slistener);
  std::cout << "[TCP] Main listener socket is closed.\n";

  return 0;
}

// Modified from https://gist.github.com/suyash/0f100b1518334fcf650bbefd54556df9
int serveUDP(int listenPort) {
	struct sockaddr_in serverAddress;
	memset(&serverAddress, 0, sizeof(serverAddress));
	serverAddress.sin_family = AF_INET;
	serverAddress.sin_port = htons(listenPort);
	serverAddress.sin_addr.s_addr = htonl(INADDR_ANY);

	int sock;
	if ((sock = socket(PF_INET, SOCK_DGRAM, 0)) < 0) {
    std::cerr << "[UDP] Could not create socket\n";
		return 1;
	}

	if ((bind(sock, (struct sockaddr *)&serverAddress,
	          sizeof(serverAddress))) < 0) {
    std::cerr << "[UDP] Could not bind socket\n";
		return 1;
	}

  char buf[INET_ADDRSTRLEN];
  std::cout << "[UDP] Socket is listening on "
            << inet_ntop(AF_INET, &serverAddress.sin_addr, buf, INET_ADDRSTRLEN)
            << ":" << ntohs(serverAddress.sin_port) << "\n";

	struct sockaddr_in client_address;
	socklen_t client_address_len = sizeof(client_address);

	while (true) {
		char buffer[4096];
    char host[NI_MAXHOST];
    char svc[NI_MAXSERV];

		int bytes = recvfrom(sock, buffer, sizeof(buffer), 0,
		                   (struct sockaddr *)&client_address,
		                   &client_address_len);

    std::cout << "[UDP] Recevied " << bytes << " bytes from " << inet_ntoa(client_address.sin_addr) << "\n";

    if (getnameinfo(
          (sockaddr*)&client_address, client_address_len,
          host, NI_MAXHOST,
          svc, NI_MAXSERV, 0) != 0) {
      std::cout << "[UDP] Client: (" << inet_ntop(AF_INET, &client_address.sin_addr, (char*)buf, INET_ADDRSTRLEN)
                << ":" << ntohs(client_address.sin_port) << ")\n";
    } else {
      std::cout << "[UDP] Client: (host: " << host << ", service: " << svc << ")\n";
    }

		sendto(sock, buffer, bytes, 0, (struct sockaddr *)&client_address,
		       sizeof(client_address));
	}

	return 0;
}

// Modified from https://gist.github.com/bdahlia/7826649
int serveHTTP(int listenPort) {
  /* variables for connection management */
  int parentfd;          /* parent socket */
  int childfd;           /* child socket */
  socklen_t clientlen;         /* byte size of client's address */
  int optval;            /* flag value for setsockopt */
  struct sockaddr_in serveraddr; /* server's addr */
  struct sockaddr_in clientaddr; /* client addr */

  /* variables for connection I/O */
  FILE *stream;          /* stream version of childfd */
  char buf[BUFFER_SIZE];     /* message buffer */
  char method[BUFFER_SIZE];  /* request method */
  char uri[BUFFER_SIZE];     /* request uri */
  char version[BUFFER_SIZE]; /* request method */
  char *p;               /* temporary pointer */
  int fd;                /* static content filedes */
  int pid;               /* process id from fork */

  /* open socket descriptor */
  parentfd = socket(AF_INET, SOCK_STREAM, 0);
  if (parentfd < 0) {
    std::cerr << "[HTTP] Opening socket failed.\n";
    return 1;
  }

  optval = 1;
  setsockopt(parentfd, SOL_SOCKET, SO_REUSEADDR,
              (const void *)&optval , sizeof(int));

  bzero((char *) &serveraddr, sizeof(serveraddr));
  serveraddr.sin_family = AF_INET;
  serveraddr.sin_addr.s_addr = htonl(INADDR_ANY);
  serveraddr.sin_port = htons(listenPort);
  if (bind(parentfd, (struct sockaddr *) &serveraddr,
            sizeof(serveraddr)) < 0) {
    std::cerr << "[HTTP] Bind socket failed.\n";
    return 1;
  }

  if (listen(parentfd, SOMAXCONN) < 0) {
    std::cerr << "[HTTP] Listen socket failed.\n";
    return 1;
  }

  const char* helloResponse = "HTTP/1.1 200 OK\n\nHello\n";
  const char* notFoundResponse = "HTTP/1.1 404 Not Found\n\nNot Found\n";

  clientlen = sizeof(clientaddr);
  while (1) {
      childfd = accept(parentfd, (struct sockaddr *) &clientaddr, &clientlen);
      if (childfd < 0) {
        std::cerr << "[HTTP] Accept client socket failed.\n";
        continue;
      }

      std::thread *worker = new std::thread([clientaddr, childfd, helloResponse, notFoundResponse]() {
        char *hostaddrp = inet_ntoa(clientaddr.sin_addr);
        if (hostaddrp == NULL) {
          std::cerr << "[HTTP] Failed on inet_ntoa.\n";
        }

        char requestBuffer[BUFFER_SIZE];
        int bytes = recv(childfd, &requestBuffer, BUFFER_SIZE, 0);
        int sentBytes;

        std::this_thread::sleep_for(std::chrono::milliseconds(rand() % 1000));

        if (!strncmp(requestBuffer, "GET / ", 6)) {
          sentBytes = send(childfd, helloResponse, strlen(helloResponse), 0);
        } else {
          sentBytes = send(childfd, notFoundResponse, strlen(notFoundResponse), 0);
        }

        if (sentBytes < 0) {
          std::cerr << "[HTTP] Send response failed.\n";
        }

        close(childfd);
      });

      runningWorkerMutex.lock();
      runningWorkerThreads.push_back(worker);
      cleanWorkerThreads();
      runningWorkerMutex.unlock();
  }

  return 0;
}

void signalHandler(int signalNumber) {
  std::cerr << "[SIGNAL] Recevied " << signalNumber << ".\n";

  runningWorkerMutex.lock();

  cleanWorkerThreads();

  std::cerr << "[SIGNAL] " << runningWorkerThreads.size() << " workers are running, wait for them ...\n";

  for (auto &worker : runningWorkerThreads) {
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
