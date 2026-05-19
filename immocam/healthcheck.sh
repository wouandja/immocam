#!/bin/sh
wget -qO- http://localhost:1010/api/actuator/health | grep -q '"status":"UP"'
