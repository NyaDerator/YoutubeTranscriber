if [ "$EUID" -ne 0 ]; then
  echo "Пожалуйста, запускайте скрипт от root/sudo"
  exit 1
fi

apt update
apt install -y nginx nodejs npm certbot python3-certbot-nginx python3

APP_DIR=$(pwd)

npm install

SERVICE_NAME="yttranscriber"

cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=YoutubeTranscriber App
After=network.target

[Service]
Type=simple
User=service
WorkingDirectory=${APP_DIR}
ExecStart=node app.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reexec
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

read -p "Введите ваш домен (например, example.com), или оставьте пустым, чтобы пропустить настройку nginx и SSL: " DOMAIN

if [ -n "$DOMAIN" ]; then
  NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
  cat > ${NGINX_CONF} <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:8080;   
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  ln -s ${NGINX_CONF} /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  certbot --nginx -d ${DOMAIN} --expand --non-interactive --agree-tos -m admin@${DOMAIN} || {
    echo "❌ Не удалось получить SSL сертификат. Проверьте DNS записи и повторите попытку вручную."
  }

  echo "✅ Готово. Node.js приложение работает на https://${DOMAIN}"
else
  echo "⚠️ Домен не указан. Пропускаю настройку nginx и SSL. Node.js приложение запущено, доступно на localhost:8080."
fi
