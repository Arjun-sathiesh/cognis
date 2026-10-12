
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
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds-v2',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    powershell '''
                        $ErrorActionPreference = "Stop"

                        if ($env:DOCKERHUB_USER -ne "arjun1110") {
                            throw "Unexpected Docker Hub username"
                        }

                        if ([string]::IsNullOrWhiteSpace($env:DOCKERHUB_TOKEN)) {
                            throw "Docker Hub token is empty"
                        }

                        Write-Output "Username matches expected value"
                        Write-Output "Docker Hub token is present"
                    '''
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds-v2',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    script {
                        try {
                            powershell '''
    Write-Output "Docker executable:"
    (Get-Command docker).Source

    Write-Output "Credential username:"
    Write-Output $env:DOCKERHUB_USER

    Write-Output "Attempting registry authentication..."

    $env:DOCKERHUB_TOKEN |
        docker login --username $env:DOCKERHUB_USER --password-stdin

    if ($LASTEXITCODE -ne 0) {
        throw "Docker Hub authentication failed"
    }

    Write-Output "Docker Hub authentication succeeded"
'''

                            bat '''
                                docker tag cognis-backend:jenkins-%BUILD_NUMBER% %DOCKERHUB_USER%/cognis-backend:build-%BUILD_NUMBER%
                                if errorlevel 1 exit /b 1

                                docker tag cognis-frontend:jenkins-%BUILD_NUMBER% %DOCKERHUB_USER%/cognis-frontend:build-%BUILD_NUMBER%
                                if errorlevel 1 exit /b 1

                                docker push %DOCKERHUB_USER%/cognis-backend:build-%BUILD_NUMBER%
                                if errorlevel 1 exit /b 1

                                docker push %DOCKERHUB_USER%/cognis-frontend:build-%BUILD_NUMBER%
                                if errorlevel 1 exit /b 1
                            '''
                        }
                        finally {
                            bat 'docker logout'
                        }
                    }
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
