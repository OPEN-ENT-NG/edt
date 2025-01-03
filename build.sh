#!/bin/bash

MVN_OPTS="-Duser.home=/var/maven"

if [ ! -e node_modules ]
then
  mkdir node_modules
fi

case `uname -s` in
  MINGW*)
    USER_UID=1000
    GROUP_UID=1000
    ;;
  *)
    if [ -z ${USER_UID:+x} ]
    then
      USER_UID=`id -u`
      GROUP_GID=`id -g`
    fi
esac

# Options
NO_DOCKER=""
SPRINGBOARD="recette"
for i in "$@"
do
case $i in
  -s=*|--springboard=*)
  SPRINGBOARD="${i#*=}"
  shift
  ;;
  --no-docker*)
  NO_DOCKER="true"
  shift
  ;;
  *)
  ;;
esac
done

clean () {
  docker-compose run --rm maven mvn $MVN_OPTS clean
}

buildNode () {
  #jenkins
  echo "[buildNode] Get branch name from jenkins env..."
  BRANCH_NAME=`echo $GIT_BRANCH | sed -e "s|origin/||g"`
  if [ "$BRANCH_NAME" = "" ]; then
    echo "[buildNode] Get branch name from git..."
    BRANCH_NAME=`git branch | sed -n -e "s/^\* \(.*\)/\1/p"`
  fi
  if [ "$BRANCH_NAME" = "" ]; then
    echo "[buildNode] Branch name should not be empty!"
    exit -1
  fi

  if [ "$BRANCH_NAME" = 'master' ]; then
      echo "[buildNode] Use entcore version from package.json ($BRANCH_NAME)"
      case `uname -s` in
        MINGW*)
          if [ "$NO_DOCKER" = "true" ] ; then
            yarn install --no-bin-links && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build
          else
            docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install --no-bin-links --legacy-peer-deps --force && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build"
          fi
          ;;
        *)
          if [ "$NO_DOCKER" = "true" ] ; then
            yarn install && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build
          else
            docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install --legacy-peer-deps --force && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build"
          fi
      esac
  else
      echo "[buildNode] Use entcore tag $BRANCH_NAME"
      case `uname -s` in
        MINGW*)
          if [ "$NO_DOCKER" = "true" ] ; then
            yarn install && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build
          else
            docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install --no-bin-links --legacy-peer-deps --force && npm rm --no-save entcore && yarn install --no-save entcore@dev && node_modules/gulp/bin/gulp.js build"
          fi
          ;;
        *)
          if [ "$NO_DOCKER" = "true" ] ; then
            yarn install --no-bin-links && yarn upgrade entcore && node_modules/gulp/bin/gulp.js build
          else
            docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install --legacy-peer-deps --force && npm rm --no-save entcore && yarn install --no-save entcore@dev && node_modules/gulp/bin/gulp.js build"
          fi
      esac
  fi
}

install() {
    docker-compose run --rm maven mvn $MVN_OPTS install -DskipTests
}

publish() {
    version=`docker-compose run --rm maven mvn $MVN_OPTS help:evaluate -Dexpression=project.version -q -DforceStdout`
    level=`echo $version | cut -d'-' -f3`

    case "$level" in
        *SNAPSHOT)
            export nexusRepository='snapshots'
            ;;
        *)
            export nexusRepository='releases'
            ;;
    esac

    docker-compose run --rm maven mvn -DrepositoryId=ode-$nexusRepository -DskiptTests -Dmaven.test.skip=true --settings /var/maven/.m2/settings.xml deploy
}

testNode () {
  rm -rf coverage
  rm -rf */build
  case `uname -s` in
    MINGW*)
      docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install --no-bin-links && node_modules/gulp/bin/gulp.js drop-cache &&  npm test"
      ;;
    *)
      docker-compose run --rm -u "$USER_UID:$GROUP_GID" node sh -c "yarn install && node_modules/gulp/bin/gulp.js drop-cache && npm test"
  esac
}

test() {
  docker-compose run --rm maven mvn $MVN_OPTS test
}

init() {
  me=`id -u`:`id -g`
  echo "DEFAULT_DOCKER_USER=$me" > .env
}

publishNexus() {
  version=`docker compose run --rm maven mvn $MVN_OPTS help:evaluate -Dexpression=project.version -q -DforceStdout`
  level=`echo $version | cut -d'-' -f3`
  case "$level" in
    *SNAPSHOT) export nexusRepository='snapshots' ;;
    *)         export nexusRepository='releases' ;;
  esac
  docker compose run --rm  maven mvn -DrepositoryId=ode-$nexusRepository -Durl=$repo -DskipTests -Dmaven.test.skip=true --settings /var/maven/.m2/settings.xml deploy
}

for param in "$@"
do
  case $param in
    clean)
      clean
      ;;
    buildNode)
      buildNode
      ;;
    buildMaven)
      install
      ;;
    watch)
      watch
      ;;
    install)
      buildNode && install
      ;;
    publish)
      publish
      ;;
    publishNexus)
      publishNexus
      ;;
    test)
      testNode ; test
      ;;
    testNode)
      testNode
      ;;
    testMaven)
      test
      ;;
    init)
      init
      ;;
    *)
      echo "Invalid argument : $param"
  esac
  if [ ! $? -eq 0 ]; then
    exit 1
  fi
done

