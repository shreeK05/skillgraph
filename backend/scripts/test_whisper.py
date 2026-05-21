import wave
import struct
import math
import os

def generate_tone(filename='test_tone.wav', duration=2.0, freq=440.0, volume=0.3, rate=16000):
    n_samples = int(rate * duration)
    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        for i in range(n_samples):
            t = float(i) / rate
            sample = volume * math.sin(2 * math.pi * freq * t)
            val = int(sample * 32767.0)
            data = struct.pack('<h', val)
            wf.writeframesraw(data)

if __name__ == '__main__':
    out = 'test_tone.wav'
    if os.path.exists(out):
        os.remove(out)
    generate_tone(out)
    print('Generated', out)
