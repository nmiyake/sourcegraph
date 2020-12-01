FROM golang:1.15-alpine@sha256:207da5bae545f35f3fe1f4a9b50bfe2bfcc91d0d96f11adeb3ccb40d6b82ed46 AS builder

WORKDIR /go/src/tracking-issue
COPY . .
RUN go mod init tracking-issue
RUN CGO_ENABLED=0 go install .

FROM sourcegraph/alpine:3.12@sha256:133a0a767b836cf86a011101995641cf1b5cbefb3dd212d78d7be145adde636d
COPY --from=builder /go/bin/* /usr/local/bin/
ENTRYPOINT ["tracking-issue"]
