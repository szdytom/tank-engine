#! /bin/sh

cd client
npm run build
cd ..
cd server
npm run build
node index.js