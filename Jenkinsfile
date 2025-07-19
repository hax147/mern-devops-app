pipeline {
  agent any

  stages {
    stage('Clone Code') {
      steps {
        git 'https://github.com/hax147/mern-devops-app.git' 
      }
    }

    stage('Build & Run with Docker Compose') {
      steps {
        sh 'docker-compose up --build -d'
      }
    }
  }
}
