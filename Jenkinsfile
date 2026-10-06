pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Cognis source code...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Preparing Cognis application...'
                sh 'echo "Build preparation completed"'
            }
        }

        stage('Test/Validate') {
            steps {
                echo 'Validating Cognis backend and frontend...'

                sh '''
                    cd backend
                    python -m compileall -q .
                '''

                sh '''
                    cd frontend
                    npm install
                    npm run build
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Cognis Docker images...'

                sh 'docker compose build'

                sh '''
                    docker tag cognis-backend:latest cognis-backend:jenkins-${BUILD_NUMBER} || true
                    docker tag cognis-frontend:latest cognis-frontend:jenkins-${BUILD_NUMBER} || true
                '''
            }
        }
    }

    post {
        success {
            echo "Cognis CI Pipeline completed successfully - Build #${BUILD_NUMBER}"
        }

        failure {
            echo "Cognis CI Pipeline failed - Build #${BUILD_NUMBER}"
        }

        always {
            echo "Pipeline execution completed."
        }
    }
}
