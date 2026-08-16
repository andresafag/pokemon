variable "name" {
  description = "Name prefix for IAM roles"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
