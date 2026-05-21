# file: backend/ml/interview/transcriber.py
import whisper
import os

class VoiceTranscriber:
    def __init__(self):
        # We use the 'base' model as per the project guide. 
        # It's small (~150MB) and runs fast on local CPUs.
        print("Loading Whisper AI model (base)...")
        try:
            self.model = whisper.load_model("base")
            print("Whisper model loaded successfully!")
        except Exception as e:
            print(f"Failed to load Whisper: {e}")
            self.model = None

    def transcribe(self, audio_path: str) -> str:
        if not self.model:
            return "Error: Whisper model is not loaded."
        
        try:
            # Transcribe the audio file to text
            result = self.model.transcribe(audio_path)
            return result["text"]
        except Exception as e:
            return f"Error transcribing audio: {e}"

# Initialize a global instance
voice_transcriber = VoiceTranscriber()