"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/chat-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  MessageSquare,
  Send,
  ShieldAlert,
  UserPlus,
  Paperclip,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

type Contact = {
  id: number
  first_name: string
  last_name: string
  role: string
  avatar_url?: string | null
  last_message?: string | null
  last_message_at?: string | null
  unread_count?: number
  last_attachment_name?: string | null
  last_attachment_type?: string | null
}

type ChatMessage = {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
  is_read: number
  sender_first_name?: string
  sender_last_name?: string
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
}

type UploadedAttachment = {
  url: string
  name: string
  type: string
  size: number
}

export default function ChatPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [deletingChat, setDeletingChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setContactsLoading(true)
      const response = await fetch("/api/chat/contacts", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to load contacts")
      }
      const data = await response.json()
      setContacts(Array.isArray(data.contacts) ? data.contacts : [])
    } catch (error) {
      console.error("[chat] contacts error:", error)
      toast.error("Не удалось загрузить список пользователей")
    } finally {
      setContactsLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(
    async (contactId: number, options: { silent?: boolean } = {}) => {
      if (!contactId) return
      try {
        if (!options.silent) {
          setMessagesLoading(true)
        }

        const response = await fetch(`/api/chat/messages?userId=${contactId}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load messages")
        }

        const data = await response.json()
        setMessages(Array.isArray(data.messages) ? data.messages : [])
      } catch (error) {
        console.error("[chat] messages error:", error)
        if (!options.silent) {
          toast.error("Не удалось загрузить сообщения")
        }
      } finally {
        if (!options.silent) {
          setMessagesLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user, fetchContacts])

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([])
      setAttachment(null)
      return
    }

    fetchMessages(selectedContactId)
    const interval = setInterval(() => {
      fetchMessages(selectedContactId, { silent: true })
      fetchContacts()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedContactId, fetchMessages, fetchContacts])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  )

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts
    }
    const term = searchQuery.trim().toLowerCase()
    return contacts.filter((contact) => {
      const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
      return fullName.includes(term)
    })
  }, [contacts, searchQuery])

  const adminContact = useMemo(() => contacts.find((contact) => contact.role === "admin") || null, [contacts])

  const handleSendMessage = async () => {
    if (!selectedContactId) {
      toast.error("Выберите собеседника")
      return
    }

    const trimmed = messageInput.trim()
    if (!trimmed && !attachment) {
      toast.error(t("chat.emptyMessageError"))
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedContactId, content: trimmed, attachment }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Не удалось отправить сообщение")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      setMessageInput("")
      setAttachment(null)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      fetchContacts()
    } catch (error: any) {
      console.error("[chat] send error:", error)
      toast.error(error?.message || "Не удалось отправить сообщение")
    } finally {
      setSending(false)
    }
  }

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (!sending) {
        handleSendMessage()
      }
    }
  }

  const handleSelectAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("chat.fileTooLarge"))
      event.target.value = ""
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    setUploadingFile(true)

    try {
      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Upload failed")
      }

      const data = await response.json()
      setAttachment(data)
      toast.success(t("chat.uploadSuccess"))
    } catch (error: any) {
      console.error("[chat] upload error:", error)
      toast.error(error?.message || t("chat.uploadError"))
    } finally {
      setUploadingFile(false)
      event.target.value = ""
    }
  }

  const handleRemoveAttachment = () => {
    setAttachment(null)
  }

  const handleDeleteConversation = async () => {
    if (!selectedContactId) return
    const confirmed = window.confirm(t("chat.deleteChatConfirm"))
    if (!confirmed) return

    setDeletingChat(true)
    try {
      const response = await fetch("/api/chat/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: selectedContactId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Delete failed")
      }

      setMessages([])
      setAttachment(null)
      await fetchContacts()
      await fetchMessages(selectedContactId, { silent: true })
      toast.success(t("chat.deleteChatSuccess"))
    } catch (error: any) {
      console.error("[chat] delete conversation error:", error)
      toast.error(error?.message || t("chat.deleteChatError"))
    } finally {
      setDeletingChat(false)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.sender_id === user?.id
    const hasAttachment = Boolean(message.attachment_url)
    const isImage = message.attachment_type?.startsWith("image/")

    return (
      <div
        key={message.id}
        className={`flex flex-col gap-1 max-w-xl ${
          isOwnMessage ? "ml-auto items-end text-right" : "mr-auto items-start text-left"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          }`}
        >
          {message.content && <p>{message.content}</p>}
          {hasAttachment && (
            <div className={`mt-3 rounded-lg border bg-background/70 ${isOwnMessage ? "text-left" : ""}`}>
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.attachment_url as string}
                  alt={t("chat.attachmentImageAlt")}
                  className="max-h-64 w-full rounded-lg object-cover"
                />
              ) : (
                <a
                  href={message.attachment_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm underline-offset-2 hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  {message.attachment_name || t("chat.attachmentDownload")}
                </a>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </span>
      </div>
    )
  }

  const attachmentPreviewLabel = (contact: Contact) => {
    if (contact.last_message && contact.last_message.trim().length > 0) {
      return contact.last_message
    }
    if (contact.last_attachment_name) {
      return t("chat.attachmentPreview")
    }
    return t("chat.noMessagesYet")
  }

  const getInitials = (first?: string, last?: string) => {
    const f = (first || "").trim()
    const l = (last || "").trim()
    return `${f ? f[0] : "U"}${l ? l[0] : "S"}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Чат доступен только авторизованным пользователям</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Войдите в систему, чтобы начать общаться с другими студентами и писать администратору.</p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/login">Войти</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-6xl px-4 space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">{t("chat.subtitle")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">{t("chat.title")}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {t("chat.subtitleHint")}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t("chat.contactsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={t("chat.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />

              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{t("chat.adminShortcutTitle")}</p>
                    <p className="text-muted-foreground">{t("chat.adminShortcutDescription")}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  variant="secondary"
                  onClick={() => adminContact && setSelectedContactId(adminContact.id)}
                  disabled={!adminContact}
                >
                  {t("chat.adminShortcutAction")}
                </Button>
              </div>

              <Separator />

              <div className="max-h-[65vh] overflow-y-auto space-y-2 pr-1">
                {contactsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t("chat.noContacts")}
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isActive = contact.id === selectedContactId
                    return (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            {contact.avatar_url && (
                              <AvatarImage src={contact.avatar_url} alt={`${contact.first_name} ${contact.last_name}`} />
                            )}
                            <AvatarFallback>{getInitials(contact.first_name, contact.last_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold leading-tight truncate">
                                {contact.first_name} {contact.last_name}
                              </p>
                              {contact.role === "admin" && <Badge variant="outline">{t("chat.adminBadge")}</Badge>}
                              {contact.unread_count ? (
                                <Badge className="ml-auto bg-primary text-white">{contact.unread_count}</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {attachmentPreviewLabel(contact)}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[500px]">
            {selectedContact ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {selectedContact.avatar_url && (
                        <AvatarImage
                          src={selectedContact.avatar_url}
                          alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                        />
                      )}
                      <AvatarFallback>{getInitials(selectedContact.first_name, selectedContact.last_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {selectedContact.first_name} {selectedContact.last_name}
                        </CardTitle>
                        {selectedContact.role === "admin" && <Badge variant="outline">{t("chat.adminBadge")}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.last_message_at
                          ? `${t("chat.lastMessageAt")} ${new Date(selectedContact.last_message_at).toLocaleString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}`
                          : t("chat.noMessagesYet")}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleDeleteConversation}
                      disabled={deletingChat}
                      title={t("chat.deleteChat")}
                    >
                      {deletingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[600px]">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground gap-2">
                        <UserPlus className="w-8 h-8" />
                        <p>{t("chat.emptyConversation")}</p>
                      </div>
                    ) : (
                      messages.map((message) => renderMessage(message))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="mt-4 space-y-2">
                    {attachment && (
                      <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          {attachment.type?.startsWith("image/") ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={handleRemoveAttachment} title={t("chat.attachmentRemove")}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Textarea
                      placeholder={t("chat.messagePlaceholder")}
                      value={messageInput}
                      onChange={(event) => {
                        if (event.target.value.length <= CHAT_MESSAGE_MAX_LENGTH) {
                          setMessageInput(event.target.value)
                        }
                      }}
                      onKeyDown={handleMessageKeyDown}
                      rows={3}
                      maxLength={CHAT_MESSAGE_MAX_LENGTH}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleSelectAttachment}
                          disabled={uploadingFile}
                          title={t("chat.attachmentAdd")}
                        >
                          {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {messageInput.length}/{CHAT_MESSAGE_MAX_LENGTH}
                        </span>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || uploadingFile || (!messageInput.trim() && !attachment)}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            {t("chat.sending")}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t("chat.send")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full p-10 gap-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{t("chat.noContactTitle")}</h3>
                  <p className="text-muted-foreground">{t("chat.noContactSubtitle")}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Alert className="bg-muted/50 border-muted-foreground/20">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t("chat.securityTitle")}</AlertTitle>
          <AlertDescription>{t("chat.securityDescription")}</AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

