#!/bin/bash

echo "cleaning directory..."
rm -R /var/www/html/ffxivltdb.welcometochristown.com/api/*

echo "deploying..."
cp -r * /var/www/html/ffxivltdb.welcometochristown.com/api

echo "finished"
