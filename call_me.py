from twilio.rest import Client
import os
from dotenv import load_dotenv
import tkinter as tk
from tkinter import messagebox
import threading

# Load environment variables
load_dotenv()

def show_call_window():
    """Show a window indicating the call has started"""
    window = tk.Tk()
    window.title("Call Status")
    window.geometry("300x150")
    
    # Center the window
    window.eval('tk::PlaceWindow . center')
    
    # Add a label
    label = tk.Label(window, text="Call has started!", font=("Arial", 14))
    label.pack(pady=20)
    
    # Add a close button
    close_button = tk.Button(window, text="Close", command=window.destroy)
    close_button.pack(pady=10)
    
    # Make window stay on top
    window.attributes('-topmost', True)
    
    window.mainloop()

def call_me(phone_number, on_success=None, on_error=None):
    """
    Make a phone call to the specified number using Twilio.
    Args:
        phone_number (str): The phone number to call in E.164 format (e.g., '+1234567890')
        on_success (callable): Function to call on success
        on_error (callable): Function to call on error
    Returns:
        dict: Information about the call
    """
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    twilio_number = os.getenv('TWILIO_PHONE_NUMBER')
    client = Client(account_sid, auth_token)
    try:
        call = client.calls.create(
            to=phone_number,
            from_=twilio_number,
            url='http://demo.twilio.com/docs/voice.xml'
        )
        if on_success:
            on_success()
        return {
            'status': 'success',
            'call_sid': call.sid,
            'message': f'Call initiated to {phone_number}'
        }
    except Exception as e:
        if on_error:
            on_error(str(e))
        return {
            'status': 'error',
            'message': str(e)
        }

def make_call_and_show_window(phone_number):
    def on_success():
        # Show the window on the main thread
        show_call_window()
    def on_error(error_msg):
        # Optionally show an error window
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Call Error", error_msg)
        root.destroy()
    # Run the Twilio call in a background thread
    threading.Thread(target=call_me, args=(phone_number, on_success, on_error), daemon=True).start()

if __name__ == "__main__":
    phone_number = "+919188056250"  # Your phone number
    make_call_and_show_window(phone_number)
    # Keep the main thread alive to allow Tkinter windows to show
    tk.mainloop() 