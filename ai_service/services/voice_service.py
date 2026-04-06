from gtts import gTTS
import io
import base64

def generate_human_voice(text: str) -> str:
    try:
        # Generate neural human-like speech using Google TTS engine
        tts = gTTS(text=text, lang='en', tld='us') # US English for neutral professional tone
        
        # Save to memory stream
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # Encode to base64 for easy JSON transfer
        audio_data = base64.b64encode(fp.read()).decode('utf-8')
        return f"data:audio/mp3;base64,{audio_data}"
    except Exception as e:
        print(f"Neural TTS Error: {e}")
        return None
