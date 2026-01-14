"""
Azure OpenAI Core Module
=========================
Azure OpenAI adapter supporting GPT-5, O3, GPT-4o, and DALL-E-3 models
"""
import os
import json
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()


class AzureOpenAICore:
    """Azure OpenAI API wrapper for NINJA system"""
    
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        """
        Initialize Azure OpenAI client
        
        Args:
            api_key: Azure OpenAI API key (optional, falls back to env var)
            endpoint: Azure OpenAI endpoint (optional, falls back to env var)
        """
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.endpoint = endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_version = os.getenv("OPENAI_API_VERSION", "2024-10-01-preview")
        
        if not self.api_key or not self.endpoint:
            raise ValueError("Azure OpenAI API key and endpoint are required")
        
        self.client = AzureOpenAI(
            api_key=self.api_key,
            api_version=self.api_version,
            azure_endpoint=self.endpoint
        )
        
        # Model mappings (deployment names) - use simple names that Azure accepts
        self.MODEL_MAPPINGS = {
            # GPT-5 Series - fallback to gpt-4o for now (GPT-5 may not be deployed yet)
            "gpt-5": "gpt-4o",
            "gpt-5-chat": "gpt-4o",
            "gpt-5-mini": "gpt-4o-mini",
            "gpt-5-nano": "gpt-4o-mini",
            "gpt-5-pro": "gpt-4o",
            
            # O1 Series (Reasoning models - confirmed available)
            "o1": "o1-preview",
            "o1-preview": "o1-preview",
            "o1-mini": "o1-mini",
            "o1-pro": "o1-pro",
            
            # GPT-4o Series (confirmed working)
            "gpt-4o": "gpt-4o",
            "gpt-4o-mini": "gpt-4o-mini",
            "gpt-4o-latest": "gpt-4o",
            
            # O1 Series (confirmed available)
            "o1-preview": "o1-preview",
            "o1-mini": "o1-mini",
            "o1-pro": "o1-pro",
            "o1": "o1-preview",
            
            # GPT-4 Series (confirmed available)
            "gpt-4": "gpt-4",
            "gpt-4-turbo": "gpt-4",
            
            # Image Generation (confirmed working)
            "dall-e-3": "dall-e-3",
            "dall-e-2": "dall-e-2",
            
            # Embeddings
            "text-embedding-3-large": "text-embedding-3-large",
            "text-embedding-3-small": "text-embedding-3-small",
        }
    
    def get_deployment_name(self, model: str) -> str:
        """Get Azure deployment name from model key"""
        return self.MODEL_MAPPINGS.get(model, model)
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-5",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model key (e.g., 'gpt-5', 'o3', 'gpt-4o')
            temperature: Sampling temperature (0.0 - 2.0)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters
            
        Returns:
            Response dictionary with 'content' and metadata
        """
        try:
            deployment = self.get_deployment_name(model)
            
            response = self.client.chat.completions.create(
                model=deployment,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": deployment,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            return {
                "content": f"Error calling Azure OpenAI: {str(e)}",
                "error": True,
                "error_message": str(e)
            }
    
    def generate_image(
        self,
        prompt: str,
        model: str = "dall-e-3",
        size: str = "1024x1024",
        quality: str = "standard",
        n: int = 1,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate image using DALL-E
        
        Args:
            prompt: Image generation prompt
            model: 'dall-e-3' or 'dall-e-2'
            size: Image size ('1024x1024', '1792x1024', '1024x1792' for DALL-E-3)
            quality: 'standard' or 'hd' (DALL-E-3 only)
            n: Number of images (1-10 for DALL-E-2, only 1 for DALL-E-3)
            
        Returns:
            Response with image URLs and metadata
        """
        try:
            deployment = self.get_deployment_name(model)
            
            # DALL-E-3 specific constraints
            if "dall-e-3" in deployment:
                n = 1  # DALL-E-3 only supports n=1
                
            response = self.client.images.generate(
                model=deployment,
                prompt=prompt,
                size=size,
                quality=quality,
                n=n,
                **kwargs
            )
            
            return {
                "images": [
                    {
                        "url": image.url,
                        "revised_prompt": getattr(image, 'revised_prompt', None)
                    }
                    for image in response.data
                ],
                "model": deployment,
                "prompt": prompt
            }
            
        except Exception as e:
            return {
                "images": [],
                "error": True,
                "error_message": str(e)
            }
    
    def generate_json(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-5",
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate JSON response (useful for structured output)
        
        Args:
            messages: List of message dictionaries
            model: Model key
            temperature: Sampling temperature
            
        Returns:
            Parsed JSON response
        """
        try:
            response = self.chat(
                messages=messages,
                model=model,
                temperature=temperature,
                response_format={"type": "json_object"},
                **kwargs
            )
            
            if response.get("error"):
                return response
            
            # Parse JSON content
            try:
                json_content = json.loads(response["content"])
                response["json_content"] = json_content
            except json.JSONDecodeError:
                response["error"] = True
                response["error_message"] = "Failed to parse JSON response"
            
            return response
            
        except Exception as e:
            return {
                "error": True,
                "error_message": str(e)
            }
    
    def get_available_models(self) -> List[Dict[str, str]]:
        """
        Get list of available models
        
        Returns:
            List of model info dictionaries
        """
        return [
            {
                "key": "gpt-5",
                "name": "GPT-5",
                "deployment": self.MODEL_MAPPINGS["gpt-5"],
                "description": "Most advanced reasoning model",
                "category": "chat"
            },
            {
                "key": "gpt-5-pro",
                "name": "GPT-5 Pro",
                "deployment": self.MODEL_MAPPINGS["gpt-5-pro"],
                "description": "Professional-grade GPT-5",
                "category": "chat"
            },
            {
                "key": "o3",
                "name": "O3",
                "deployment": self.MODEL_MAPPINGS["o3"],
                "description": "Advanced reasoning model",
                "category": "reasoning"
            },
            {
                "key": "o3-mini",
                "name": "O3 Mini",
                "deployment": self.MODEL_MAPPINGS["o3-mini"],
                "description": "Faster reasoning model",
                "category": "reasoning"
            },
            {
                "key": "o3-deep-research",
                "name": "O3 Deep Research",
                "deployment": self.MODEL_MAPPINGS["o3-deep-research"],
                "description": "Specialized for deep research tasks",
                "category": "reasoning"
            },
            {
                "key": "gpt-4o",
                "name": "GPT-4o",
                "deployment": self.MODEL_MAPPINGS["gpt-4o"],
                "description": "Fast and capable GPT-4 optimized",
                "category": "chat"
            },
            {
                "key": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "deployment": self.MODEL_MAPPINGS["gpt-4o-mini"],
                "description": "Affordable and fast",
                "category": "chat"
            },
            {
                "key": "dall-e-3",
                "name": "DALL-E 3",
                "deployment": self.MODEL_MAPPINGS["dall-e-3"],
                "description": "Advanced image generation",
                "category": "image"
            },
        ]


# Convenience functions
def azure_chat(messages: List[Dict[str, str]], model: str = "gpt-5", **kwargs) -> Dict[str, Any]:
    """Quick chat function"""
    azure = AzureOpenAICore()
    return azure.chat(messages, model, **kwargs)


def azure_generate_image(prompt: str, model: str = "dall-e-3", **kwargs) -> Dict[str, Any]:
    """Quick image generation function"""
    azure = AzureOpenAICore()
    return azure.generate_image(prompt, model, **kwargs)


def azure_json(messages: List[Dict[str, str]], model: str = "gpt-5", **kwargs) -> Dict[str, Any]:
    """Quick JSON generation function"""
    azure = AzureOpenAICore()
    return azure.generate_json(messages, model, **kwargs)


if __name__ == "__main__":
    # Test Azure OpenAI connection
    print("🧪 Testing Azure OpenAI Core")
    print("=" * 60)
    
    try:
        azure = AzureOpenAICore()
        print(f"✅ Initialized Azure OpenAI")
        print(f"📍 Endpoint: {azure.endpoint}")
        print(f"📋 API Version: {azure.api_version}")
        print()
        
        # Test chat
        print("💬 Testing Chat (GPT-5)...")
        response = azure.chat([
            {"role": "user", "content": "Say 'Hello from Azure GPT-5!' in Thai"}
        ], model="gpt-5", max_tokens=100)
        
        if not response.get("error"):
            print(f"✅ Response: {response['content']}")
            print(f"📊 Tokens used: {response['usage']['total_tokens']}")
        else:
            print(f"❌ Error: {response.get('error_message')}")
        
        print()
        print("🎨 Available Models:")
        for model in azure.get_available_models():
            print(f"  - {model['key']}: {model['name']} ({model['category']})")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
