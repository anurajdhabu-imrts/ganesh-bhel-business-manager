import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Send, X, Mic, CheckCircle, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { SystemData, Purchase, DailySales } from "../types";

interface HelpAssistantProps {
  data: SystemData;
  onAddParsedPurchase: (pur: Partial<Purchase>) => void;
  onAddParsedSales: (sales: DailySales) => void;
}

export default function HelpAssistant({ data, onAddParsedPurchase, onAddParsedSales }: HelpAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: data.language === "mr" 
        ? "नमस्कार! मी आपला गणेश भेळ बिझनेस असिस्टंट आहे. आपण मला कोणत्याही व्यवहाराबद्दल विचारू शकता किंवा 'Mahesh Traders कडून १००० रुपयांची शेव खरेदी केली' अशी व्हॉइस कमांड देऊ शकता!" 
        : "Hello! I am your Ganesh Bhel assistant. Ask me questions like 'Staff outstanding advances', 'Weekly profit trends', or speak/type a transaction command to parse it!"
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  // Command parsing state
  const [voiceInput, setVoiceInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    entryType: 'purchase' | 'sales' | 'unknown';
    parsedFields: any;
    confidence: number;
    explanation: string;
  } | null>(null);
  const [parseSuccessMsg, setParseSuccessMsg] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;

    if (!customText) {
      setInputValue("");
    }

    const updatedMessages = [...chatMessages, { role: 'user' as const, content: textToSend }];
    setChatMessages(updatedMessages);
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const resData = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: resData.reply }]);
    } catch (error) {
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "Sorry, I am facing connectivity issues, but I am here in offline state! Ask again shortly." 
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const parseVoiceCommand = async () => {
    if (!voiceInput.trim()) return;
    setIsParsing(true);
    setParseResult(null);
    setParseSuccessMsg("");

    try {
      const response = await fetch("/api/ai/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: voiceInput }),
      });
      const parsed = await response.json();
      setParseResult(parsed);
    } catch (error) {
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParse = () => {
    if (!parseResult || !parseResult.parsedFields) return;

    if (parseResult.entryType === 'purchase') {
      onAddParsedPurchase(parseResult.parsedFields);
      setParseSuccessMsg(
        data.language === 'mr' 
          ? "खरेदी यशस्वीरीत्या जोडली गेली आहे!" 
          : "Purchase entry parsed and added successfully!"
      );
    } else if (parseResult.entryType === 'sales') {
      const salesTemplate: DailySales = {
        id: parseResult.parsedFields.date || new Date().toISOString().split('T')[0],
        date: parseResult.parsedFields.date || new Date().toISOString().split('T')[0],
        totalSales: Number(parseResult.parsedFields.totalSales || 0),
        cashCollection: Number(parseResult.parsedFields.cashCollection || 0),
        upiCollection: Number(parseResult.parsedFields.upiCollection || 0),
        cardCollection: Number(parseResult.parsedFields.cardCollection || 0),
        swiggyCollection: Number(parseResult.parsedFields.swiggyCollection || 0),
        zomatoCollection: Number(parseResult.parsedFields.zomatoCollection || 0),
        otherCollection: Number(parseResult.parsedFields.otherCollection || 0),
        remarks: parseResult.parsedFields.remarks || "AI Parsed Voice Summary"
      };
      onAddParsedSales(salesTemplate);
      setParseSuccessMsg(
        data.language === 'mr' 
          ? "विक्री यशस्वीरीत्या जोडली गेली आहे!" 
          : "Sales summary parsed and added successfully!"
      );
    }
    setParseResult(null);
    setVoiceInput("");
  };

  const quickPrompts = data.language === "mr" ? [
    "या महिन्याचा एकूण नफा किती?",
    "सर्वात जास्त ॲडव्हान्स कोणाचा आहे?",
    "कोणता माल कमी पडला आहे?",
    "एकूण कर्मचारी पगार किती आहे?"
  ] : [
    "What is our profit this month?",
    "Who has highest outstanding advance?",
    "Which ingredients are low stock?",
    "What is our salary cost?"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative" id="help-assistant-block">
      {/* Tab select header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
          <h2 className="font-bold tracking-tight text-white">
            {data.language === "mr" ? "गणेश भेळ AI असिस्टंट" : "Ganesh Bhel AI Assistant"}
          </h2>
        </div>
        <div className="bg-white/20 px-2 py-1 rounded text-xs backdrop-blur font-mono">
          {data.language === "mr" ? "सक्षम" : "GEMINI ACTIVE"}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Voice/Typed Command Parser */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2 font-semibold text-gray-800 text-sm">
              <Mic className="w-4 h-4 text-orange-500" />
              <span>
                {data.language === "mr" ? "व्हॉइस / स्मार्ट नोंदणी केंद्र" : "Voice / Smart Input Entry"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {data.language === "mr"
                ? "तुम्ही खरेदी किंवा विक्रीची तोंडी माहिती लिहून नोंदणी स्वयंचलित करू शकता. उदा: 'HP Gas वरून १८५० रुपयाचा गॅस सिलिंडर खरेदी केला पेमेंट UPI केले.'"
                : "Type or paste speech-to-text transcript. AI will decode it into a purchase or sales voucher automatically!"}
            </p>

            <div className="relative">
              <textarea
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder={data.language === "mr" 
                  ? "उदा. 'महेश ट्रेडर्स कडून २२०० रुपयांची बटाटे खरेदी रोख स्वरूपात केली...'" 
                  : "e.g., 'Purchased Sev worth Rs 1500 from Mahesh Traders paid through UPI...'"
                }
                rows={3}
                className="w-full text-sm bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition"
              />
              <button 
                onClick={() => {
                  const demo = data.language === "mr"
                    ? "Mahesh Traders कडून १५०० रुपयाची शेव खरेदी केली पेमेंट UPI द्वारे केले."
                    : "Purchased Potatoes worth Rs 850 from Pune Veg Wholesale on cash.";
                  setVoiceInput(demo);
                }}
                className="absolute right-2 bottom-3 text-[10px] text-gray-400 hover:text-orange-500 bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer"
              >
                {data.language === "mr" ? "नमुना भरा" : "Fill Demo"}
              </button>
            </div>

            {/* Error or Success notification */}
            {parseSuccessMsg && (
              <div className="mt-3 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{parseSuccessMsg}</span>
              </div>
            )}

            {/* Parse preview Card */}
            {parseResult && parseResult.parsedFields && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-gray-700"
              >
                <div className="font-bold text-orange-700 flex justify-between items-center mb-1">
                  <span>
                    {parseResult.entryType === 'purchase' ? '🛒 PURCHASE DETECTED' : '📈 SALES DETECTED'}
                  </span>
                  <span className="text-[10px] bg-orange-200 px-1.5 py-0.5 rounded text-orange-800">
                    Match: {parseResult.confidence}%
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-600 mb-2 italic">
                  "{parseResult.explanation}"
                </div>

                {parseResult.entryType === 'purchase' && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 bg-white p-2 rounded border border-orange-100">
                    <div>Category: <span className="font-medium">{parseResult.parsedFields.category || "General"}</span></div>
                    <div>Item: <span className="font-medium">{parseResult.parsedFields.itemName || "Stock"}</span></div>
                    <div>Amount: <span className="font-bold text-orange-600">₹{parseResult.parsedFields.amount || 0}</span></div>
                    <div>Payment: <span className="font-medium">{parseResult.parsedFields.paymentMode || "UPI"}</span></div>
                    <div>Vendor: <span className="font-medium">{parseResult.parsedFields.vendorName || "Mahesh Traders"}</span></div>
                    <div>Type: <span className="font-medium">{parseResult.parsedFields.purchaseType || "Shop"}</span></div>
                  </div>
                )}

                {parseResult.entryType === 'sales' && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 bg-white p-2 rounded border border-orange-100">
                    <div>Total Sales: <span className="font-bold text-orange-600">₹{parseResult.parsedFields.totalSales || 0}</span></div>
                    <div>UPI: <span className="font-medium">₹{parseResult.parsedFields.upiCollection || 0}</span></div>
                    <div>Cash: <span className="font-medium">₹{parseResult.parsedFields.cashCollection || 0}</span></div>
                    <div>Card: <span className="font-medium">₹{parseResult.parsedFields.cardCollection || 0}</span></div>
                    <div>Others: <span className="font-medium">₹{parseResult.parsedFields.otherCollection || 0}</span></div>
                  </div>
                )}

                <div className="mt-3 flex space-x-2 justify-end">
                  <button
                    onClick={() => setParseResult(null)}
                    className="px-2.5 py-1 text-gray-500 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmParse}
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 cursor-pointer flex items-center space-x-1 font-bold text-[11px]"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Confirm & Insert</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-3">
            <button
              onClick={parseVoiceCommand}
              disabled={isParsing || !voiceInput.trim()}
              className={`w-full py-2 px-4 rounded-lg font-bold text-sm tracking-wide shadow-sm flex items-center justify-center space-x-2 cursor-pointer transition ${
                isParsing || !voiceInput.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decoding Transaction...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>{data.language === 'mr' ? "नोंद तयार करा (Parse AI)" : "Parse with GBMS AI"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Interactive AI Chat Helper */}
        <div className="bg-white rounded-xl flex flex-col h-[320px] border border-gray-100 overflow-hidden shadow-inner">
          {/* Chat Messages Log */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl p-2.5 shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-auto bg-gradient-to-tr from-orange-50 to-orange-100 text-gray-800 border-r-2 border-orange-500 rounded-tr-none'
                    : 'bg-gray-50 text-gray-800 border-l-2 border-amber-500 rounded-tl-none'
                }`}
              >
                <div className="font-bold text-[10px] uppercase text-gray-400 mb-0.5">
                  {msg.role === 'user' ? 'You' : 'GBMS AI'}
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
            {isSending && (
              <div className="bg-gray-50 rounded-2xl rounded-tl-none p-2.5 max-w-[85%] border-l-2 border-orange-500 flex items-center space-x-2 text-gray-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>AI is calculating/thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick tap helpers */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="text-[10px] bg-white border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300 rounded px-2 py-1 cursor-pointer transition whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Message Input */}
          <div className="p-2 border-t border-gray-100 bg-white flex items-center space-x-1.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={data.language === 'mr' ? "व्यवसायाबद्दल काहीही विचारा..." : "Ask assistant about business stats..."}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-orange-400 focus:bg-white"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
