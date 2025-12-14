import os
from ollama import Client 
from dotenv import load_dotenv

load_dotenv()
OLLAMA_API=os.environ.get('OLLAMA_API')

client = Client(
    host='https://ollama.com',
    headers={'Authorization': 'Bearer ' + OLLAMA_API}
)

messages = [
  {
    'role': 'user',
    'content': 'Why is the sky blue?',
  },
]

def t():
    for part in client.chat('gpt-oss:120b', messages=messages, stream=True):
        print(part['message']['content'], end='', flush=True)
  
  
  
  
if __name__=="__main__":
    t()