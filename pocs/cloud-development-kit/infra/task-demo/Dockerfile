FROM public.ecr.aws/lambda/python:3.9

# Copy function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Install any dependencies if needed
# RUN pip install --no-cache-dir -r requirements.txt

# Set the CMD to your handler
CMD [ "app.handler" ]
