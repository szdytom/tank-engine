#! /bin/sh

cd client
npm install
npm run build
cd ..
cd server
npm install
npm run build
node index.js