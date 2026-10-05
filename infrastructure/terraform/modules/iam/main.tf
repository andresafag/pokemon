data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ---------------------------------------------------------------------------
# Execution Role — used by the ECS agent to pull images and write logs
# ---------------------------------------------------------------------------
resource "aws_iam_role" "execution" {
  name               = "${var.name}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "execution_secrets_read" {
  name = "${var.name}-ecs-execution-secrets-read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOpenAISecret"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:us-east-1:688567305851:secret:openai-api-keys*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "execution_secrets_read" {
  role       = aws_iam_role.execution.name
  policy_arn = aws_iam_policy.execution_secrets_read.arn
}

# ---------------------------------------------------------------------------
# Task Role — granted to the running container for app-level AWS API calls
# ---------------------------------------------------------------------------
resource "aws_iam_role" "task" {
  name               = "${var.name}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
  tags               = var.tags
}
