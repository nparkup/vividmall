FROM node:22-slim
# 문서 변환(Word/Excel/PPT<->PDF)이 필요하면 빌드 인자 WITH_OFFICE=1 (이미지가 커지고 메모리 사용이 늘어납니다)
ARG WITH_OFFICE=0
RUN if [ "$WITH_OFFICE" = "1" ]; then apt-get update && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-calc libreoffice-impress fonts-nanum fonts-noto-cjk && rm -rf /var/lib/apt/lists/*; fi
WORKDIR /app
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
