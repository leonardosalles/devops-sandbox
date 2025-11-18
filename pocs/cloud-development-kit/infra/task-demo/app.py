import json
import os
import importlib.util
from typing import Dict, Any, Optional, Type, get_type_hints
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class ParameterDefinition:
    type: str
    description: str = ""
    required: bool = False
    default: Any = None
    options: list = field(default_factory=list)

class TaskContext:
    def __init__(self, context_file: str):
        self.context_file = context_file
        self.context = self._load_context()
        self.parameters = self._validate_parameters()
    
    def _load_context(self) -> Dict[str, Any]:
        with open(self.context_file, 'r') as f:
            return json.load(f)
    
    def _validate_parameters(self) -> Dict[str, Any]:
        parameters = {}
        params_def = self.context.get('parameters', {})
        
        for param_name, param_def in params_def.items():
            param_value = param_def.get('default')
            
            param_type = param_def.get('type', 'string')
            if param_value is not None:
                try:
                    if param_type == 'number':
                        param_value = float(param_value)
                    elif param_type == 'integer':
                        param_value = int(param_value)
                    elif param_type == 'boolean':
                        param_value = bool(param_value)
                except (ValueError, TypeError) as e:
                    raise ValueError(f"Invalid value for parameter '{param_name}': {e}")
            
            parameters[param_name] = param_value
        
        return parameters

class Task:
    def __init__(self, context: Dict[str, Any]):
        self.context = context
        self.task_name = context.get('taskName', 'unknown')
        self.parameters = context.get('parameters', {})
    
    def execute(self) -> Dict[str, Any]:
        """Execute the task and return the result."""
        raise NotImplementedError("Subclasses must implement execute method")

class HelloTask(Task):
    def execute(self) -> Dict[str, Any]:
        name = self.parameters.get('name', 'World')
        repeat = int(self.parameters.get('repeat', 1))
        
        message = ", ".join([f"Hello, {name}!"] * repeat)
        
        return {
            'status': 'SUCCESS',
            'message': message,
            'parameters': self.parameters
        }

def get_task_class(task_name: str) -> Type[Task]:
    """Get the task class based on task name."""
    task_classes = {
        'hello': HelloTask,
    }
    return task_classes.get(task_name)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        task_dir = os.path.dirname(os.path.abspath(__file__))
        context_file = os.path.join(task_dir, 'context.json')
        
        task_context = TaskContext(context_file)
        
        task_class = get_task_class(task_context.context['taskName'])
        if not task_class:
            raise ValueError(f"No task handler found for: {task_context.context['taskName']}")
        
        if 'parameters' in event:
            task_context.parameters.update(event['parameters'])
        
        task = task_class({
            'taskName': task_context.context['taskName'],
            'parameters': task_context.parameters
        })
        
        result = task.execute()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'taskName': task_context.context['taskName'],
                **result
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
            "name": "Local Test",
            "repeat": 2
        }
    }
    print(handler(test_event, None))
