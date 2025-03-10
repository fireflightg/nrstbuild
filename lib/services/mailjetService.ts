import Mailjet from "node-mailjet"

class MailjetService {
  private client: Mailjet

  constructor() {
    this.client = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY || "",
      apiSecret: process.env.MAILJET_SECRET_KEY || "",
    })
  }

  async createContact(email: string, name?: string, properties?: Record<string, any>) {
    try {
      const response = await this.client.post("contact").request({
        Email: email,
        Name: name,
        Properties: properties,
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error creating Mailjet contact:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async createContactsList(name: string, description?: string) {
    try {
      const response = await this.client.post("contactslist").request({
        Name: name,
        Description: description,
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error creating Mailjet contacts list:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async addContactToList(email: string, listId: number) {
    try {
      const response = await this.client.post("listrecipient").request({
        ContactID: email,
        ListID: listId,
        IsActive: true,
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error adding contact to list:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async sendEmail({
    from,
    to,
    subject,
    text,
    html,
    templateId,
    variables,
  }: {
    from: { email: string; name?: string }
    to: { email: string; name?: string }[]
    subject: string
    text?: string
    html?: string
    templateId?: number
    variables?: Record<string, any>
  }) {
    try {
      const messages = to.map((recipient) => {
        const message: Record<string, any> = {
          From: {
            Email: from.email,
            Name: from.name || "",
          },
          To: [
            {
              Email: recipient.email,
              Name: recipient.name || "",
            },
          ],
          Subject: subject,
        }

        if (templateId) {
          message.TemplateID = templateId
          message.TemplateLanguage = true
          message.Variables = variables || {}
        } else {
          message.TextPart = text
          message.HTMLPart = html
        }

        return message
      })

      const response = await this.client.post("send", { version: "v3.1" }).request({
        Messages: messages,
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error sending email:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async createCampaignDraft({
    name,
    subject,
    sender,
    listIds,
    htmlContent,
    textContent,
  }: {
    name: string
    subject: string
    sender: { email: string; name: string }
    listIds: number[]
    htmlContent: string
    textContent?: string
  }) {
    try {
      const response = await this.client.post("campaigndraft").request({
        Title: name,
        Subject: subject,
        ContactsListID: listIds[0], // Primary list
        Sender: { Email: sender.email, Name: sender.name },
        SenderEmail: sender.email,
        SenderName: sender.name,
        Status: 0, // Draft status
        Locale: "en_US",
        Html: htmlContent,
        Text: textContent || "",
      })

      // Add additional lists if there are more than one
      if (listIds.length > 1) {
        const draftId = response.body.Data[0].ID
        for (let i = 1; i < listIds.length; i++) {
          await this.client.post(`campaigndraft/${draftId}/lists`).request({
            ListID: listIds[i],
            Action: "add",
          })
        }
      }

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error creating campaign draft:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async scheduleCampaign(campaignId: number, scheduledDate: Date) {
    try {
      const response = await this.client.post(`campaigndraft/${campaignId}/schedule`).request({
        Date: scheduledDate.toISOString(),
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error scheduling campaign:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async sendCampaignTest(campaignId: number, recipients: string[]) {
    try {
      const response = await this.client.post(`campaigndraft/${campaignId}/test`).request({
        Recipients: recipients.map((email) => ({ Email: email })),
      })

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error sending campaign test:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async sendCampaign(campaignId: number) {
    try {
      const response = await this.client.post(`campaigndraft/${campaignId}/send`).request()

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error sending campaign:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async getCampaignStats(campaignId: number) {
    try {
      const response = await this.client.get(`campaignstatistics/${campaignId}`).request()

      return {
        success: true,
        data: response.body,
      }
    } catch (error) {
      console.error("Error getting campaign stats:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }
}

export const mailjetService = new MailjetService()

