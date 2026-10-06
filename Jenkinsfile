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
                bat 'echo Build preparation completed'
            }
        }

        stage('Test/Validate') {
            steps {
                echo 'Validating Cognis backend...'

                bat '''
                    cd backend
                    python -m compileall -q .
                '''

                echo 'Validating Cognis frontend...'

                bat '''
                    cd frontend
                    npm install
                    npm run build
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Cognis Docker images for Jenkins build #${BUILD_NUMBER}..."

                bat "docker build -t cognis-backend:jenkins-${BUILD_NUMBER} ./backend"

                bat "docker build -t cognis-frontend:jenkins-${BUILD_NUMBER} ./frontend"

                bat 'docker images | findstr cognis'
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
