import json
import sys

def handler(event, context):
    try:
        task_name = event.get('taskName', 'default')
        params = event.get('parameters', {})
        
        if task_name == 'hello':
            name = params.get('name', 'World')
            message = f"Hello, {name}!"
        else:
            raise ValueError(f"Unknown task: {task_name}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'taskName': task_name,
                'message': message,
                'parameters': params
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'taskName': event.get('taskName', 'unknown'),
                'parameters': event.get('parameters', {})
            })
        }

if __name__ == "__main__":
    test_event = {
        "taskName": "hello",
        "parameters": {
            "name": "Local Test"
        }
    }
    print(handler(test_event, None))
