ARG ARCH='amd64'
FROM ${ARCH}/node:16-buster-slim


ENV CLOUDFLARE_AUTH_METHOD="global"
ENV CLOUDFLARE_RECORD_PROXY="true"

RUN adduser rootless --no-create-home --uid 666

USER rootless

COPY --chown=rootless ./src /usr/share/cloudflare-updater

WORKDIR /usr/share/cloudflare-updater

CMD ['node', 'index.mjs']
