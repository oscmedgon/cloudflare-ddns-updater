FROM bash:5.1

ENV CLUDFLARE_AUTH_METHOD="token"
ENV CLUDFLARE_RECORD_PROXY="true"

RUN adduser -s /bin/bash -DH rootless -u 666 -g 666

USER rootless

COPY ./cloudflare-updater /usr/bin/cloudflare-updater

CMD ['cloudflare-updater']
