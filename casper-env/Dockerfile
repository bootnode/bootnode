# FROM ubuntu:18.04

# RUN apt-get update
# RUN apt-get install curl gnupg openjdk-11-jre-headless -y
# RUN curl -sO http://repo.casperlabs.io/casperlabs/repo/master/casperlabs-node_0.2_all.deb
# RUN curl -sO http://repo.casperlabs.io/casperlabs/repo/master/casperlabs-engine-grpc-server_0.2_amd64.deb
# RUN curl -sO http://repo.casperlabs.io/casperlabs/repo/master/casperlabs-client_0.2_all.deb
# RUN dpkg -i casperlabs-node_0.2_all.deb
# RUN dpkg -i casperlabs-engine-grpc-server_0.2_amd64.deb
# RUN dpkg -i casperlabs-client_0.2_all.deb

# FROM ubuntu:18.04

# RUN apt-get update
# RUN apt-get install curl gnupg openjdk-11-jre-headless -y
# RUN echo "deb https://dl.bintray.com/casperlabs/debian /" | tee -a /etc/apt/sources.list.d/sbt.list
# RUN curl -o casperlabs-public.key.asc https://bintray.com/user/downloadSubjectPublicKey?username=casperlabs
# RUN apt-key add casperlabs-public.key.asc
# RUN apt-get update
# RUN apt install casperlabs -y

FROM openjdk:11-slim
RUN apt-get update
RUN apt-get install psmisc unzip git gnupg apt-transport-https ca-certificates openssl dirmngr -y
RUN echo "deb https://dl.bintray.com/sbt/debian /" | tee -a /etc/apt/sources.list.d/sbt.list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2EE0EA64E40A89B84B2DF73499E82A75642AC823
RUN apt-get update
RUN apt-get install sbt build-essential cmake curl -y
RUN curl https://sh.rustup.rs -sSf > $HOME/rustup.sh
RUN chmod 775 $HOME/rustup.sh
RUN $HOME/rustup.sh -y
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.25.0/install.sh | bash
RUN bash -c "source $HOME/.cargo/env; rustup update"
RUN bash -c "source $HOME/.cargo/env; rustup toolchain install nightly"
RUN bash -c "source $HOME/.cargo/env; rustup target add wasm32-unknown-unknown --toolchain nightly"
ENV PROTOC_VERSION=3.6.1
ENV PROTOC_ZIP=protoc-$PROTOC_VERSION-linux-x86_64.zip
RUN curl -OL https://github.com/google/protobuf/releases/download/v$PROTOC_VERSION/$PROTOC_ZIP
RUN unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
RUN rm -f $PROTOC_ZIP
RUN git clone -b v0.3.1 https://github.com/CasperLabs/CasperLabs.git

COPY scripts/ scripts
RUN ./scripts/build.sh
