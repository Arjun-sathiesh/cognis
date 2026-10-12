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
                echo 'Installing backend dependencies and running tests...'

                bat '''
                    cd backend
                    python -m pip install -r requirements.txt
                    python -m pytest ../testcases/api/test_extractor.py -v
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
        
stage('Verify Docker Hub Credential') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-creds',
            usernameVariable: 'DOCKERHUB_USER',
            passwordVariable: 'DOCKERHUB_TOKEN'
        )]) {
            powershell '''
                if ($env:DOCKERHUB_USER -ne "arjun1110") {
                    Write-Error "Unexpected Docker Hub username"
                    exit 1
                }

                if ([string]::IsNullOrWhiteSpace($env:DOCKERHUB_TOKEN)) {
                    Write-Error "Docker Hub token is empty"
                    exit 1
                }

                Write-Output "Username matches expected value"
                Write-Output "Token is present; length: $($env:DOCKERHUB_TOKEN.Length)"
            '''
        }
    }
}

    
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                   powershell '''
                $env:DOCKERHUB_TOKEN | docker login -u $env:DOCKERHUB_USER --password-stdin
                if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
                '''

                    bat '''
                        docker tag cognis-backend:jenkins-%BUILD_NUMBER% %DOCKERHUB_USER%/cognis-backend:build-%BUILD_NUMBER%
                        docker tag cognis-frontend:jenkins-%BUILD_NUMBER% %DOCKERHUB_USER%/cognis-frontend:build-%BUILD_NUMBER%

                        docker push %DOCKERHUB_USER%/cognis-backend:build-%BUILD_NUMBER%
                        docker push %DOCKERHUB_USER%/cognis-frontend:build-%BUILD_NUMBER%

                        docker logout
                    '''
                }
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
