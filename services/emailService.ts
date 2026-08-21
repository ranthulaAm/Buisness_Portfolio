
import { Order, OrderStatus } from '../types';
import { getEmailConfig } from './dataService';

/**
 * Placeholder service for sending transactional emails.
 * In a production environment, this would connect to an API (e.g., SendGrid, AWS SES, Mailgun).
 */
export const sendConfirmationEmail = async (order: Order): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const config = await getEmailConfig();
    const trackingUrl = `${window.location.origin}/tracking?id=${order.id}`;
    
    const emailSubject = config.emailSubjectTemplate
        .replace(/{orderId}/g, order.id)
        .replace(/{clientName}/g, order.clientName)
        .replace(/{serviceType}/g, order.serviceType);
        
    const emailBody = config.emailBodyTemplate
        .replace(/{orderId}/g, order.id)
        .replace(/{clientName}/g, order.clientName)
        .replace(/{serviceType}/g, order.serviceType)
        .replace(/{price}/g, order.price.toString())
        .replace(/{estimatedCompletion}/g, order.estimatedCompletion || 'TBA')
        .replace(/{trackingUrl}/g, trackingUrl);
    
    const fullEmailContent = `
----------------------------------------------------
[MOCK EMAIL SERVICE]
To: ${order.email}
Subject: ${emailSubject}
----------------------------------------------------
${emailBody}
----------------------------------------------------
    `;

    // Simulate network latency (1.5 seconds)
    setTimeout(() => {
      console.log(fullEmailContent); // Log to console for developer verification
      resolve(true);
    }, 1500);
  });
};

export const sendStatusUpdateEmail = async (order: Order, newStatus: OrderStatus): Promise<boolean> => {
  return new Promise((resolve) => {
    const trackingUrl = `${window.location.origin}/tracking?id=${order.id}`;
    let subject = `Update on Order #${order.id}`;
    let message = "";

    switch (newStatus) {
      case OrderStatus.REVIEWING:
        subject = `We are reviewing your order #${order.id}`;
        message = `We have received your requirements and are currently reviewing them to ensure we have everything we need. We will start processing shortly.`;
        break;
      case OrderStatus.IN_PROGRESS:
        subject = `Work Started: Order #${order.id}`;
        message = `Great news! Work has officially begun on your project. sit tight, we are crafting something amazing.`;
        break;
      case OrderStatus.DRAFT_SENT:
        subject = `Draft Ready: Order #${order.id}`;
        message = `A draft is ready for your review! Please visit the tracking link below to view the draft and provide feedback or approve it.`;
        break;
      case OrderStatus.WAITING_PAYMENT:
        subject = `Payment Required: Order #${order.id}`;
        message = `Thank you for approving the draft! Your project is now waiting for payment verification. Please contact the admin to complete the payment so we can release the final files.`;
        break;
      case OrderStatus.COMPLETED:
        subject = `Project Completed: Order #${order.id}`;
        message = `Your project has been marked as Completed! You can now download your final assets. Thank you for working with us!`;
        break;
      case OrderStatus.REVISION:
        subject = `Revision Request Received: Order #${order.id}`;
        message = `We have received your revision request. We will review your notes and get back to work on the changes.`;
        break;
      default:
        message = `The status of your order has been updated to: ${newStatus}`;
    }

    const emailBody = `
----------------------------------------------------
[MOCK EMAIL SERVICE]
To: ${order.email}
Subject: ${subject}
----------------------------------------------------
Dear ${order.clientName},

${message}

You can track progress here:
${trackingUrl}

Best regards,
Ranthula Am
----------------------------------------------------
    `;

    setTimeout(() => {
      console.log("STATUS UPDATE EMAIL SENT:", emailBody);
      resolve(true);
    }, 1000);
  });
};
export const sendPaymentDetailsEmail = async (collab: any): Promise<boolean> => {
  return new Promise((resolve) => {
    const trackingUrl = `${window.location.origin}/share/${collab.id}`;
    let subject = `Payment Details for ${collab.brandName} Collaboration`;
    const amountPaid = collab.paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0);
    const amountDue = collab.totalPrice - amountPaid;
    
    let message = `Thank you for collaborating with us. Here is the summary of your project and payment details.\n\n`;
    message += `Services:\n`;
    collab.services.forEach((s: any) => {
      message += `- ${s.quantity}x ${s.serviceName} (LKR ${s.unitPrice.toLocaleString()} each) - Total: LKR ${s.lineTotal.toLocaleString()}\n`;
      if (s.shareLink) {
        message += `  Link: ${s.shareLink}\n`;
      }
    });

    if (collab.additionalCharges && collab.additionalCharges.length > 0) {
      message += `\nAdditional Charges:\n`;
      collab.additionalCharges.forEach((c: any) => {
        message += `- ${c.name}: LKR ${c.price.toLocaleString()}\n`;
      });
    }

    message += `\nTotal Project Price: LKR ${collab.totalPrice.toLocaleString()}\n`;
    message += `Amount Paid: LKR ${amountPaid.toLocaleString()}\n`;
    message += `Amount Due: LKR ${amountDue.toLocaleString()}\n`;
    
    if (collab.billingType === 'recurring' && collab.nextBillingDate) {
      message += `Next Billing Date: ${new Date(collab.nextBillingDate).toLocaleDateString()}\n`;
    }

    const emailList = collab.contactEmails && collab.contactEmails.length > 0 ? collab.contactEmails.join(', ') : collab.contactEmail;

    const emailBody = `
----------------------------------------------------
[MOCK EMAIL SERVICE]
To: ${emailList}
Subject: ${subject}
----------------------------------------------------
Dear ${collab.contactName || collab.brandName},

${message}

You can access your shared files here:
${trackingUrl}

Best regards,
Ranthula Am
----------------------------------------------------
    `;

    setTimeout(() => {
      console.log("PAYMENT DETAILS EMAIL SENT:", emailBody);
      resolve(true);
    }, 1000);
  });
};
export const sendPromotionalEmail = async (email: string, clientName: string, type: 'offer' | 'feedback'): Promise<boolean> => {
  return new Promise((resolve) => {
    let subject = '';
    let message = '';

    if (type === 'offer') {
      subject = `Special Offer Just For You, ${clientName}!`;
      message = `Hello ${clientName},\n\nAs a valued client, we want to offer you an exclusive discount on your next project with us. Reply to this email to claim your 20% off coupon!`;
    } else {
      subject = `We'd love your feedback, ${clientName}!`;
      message = `Hello ${clientName},\n\nWe hope you're doing well. We are always looking to improve our services and would love to hear your thoughts on your recent experience working with us. Reply to this email and let us know!`;
    }

    const emailBody = `
----------------------------------------------------
[MOCK PROMOTIONAL EMAIL]
To: ${email}
Subject: ${subject}
----------------------------------------------------
${message}

Best regards,
Ranthula Am
----------------------------------------------------
    `;

    setTimeout(() => {
      console.log("PROMOTIONAL EMAIL SENT:", emailBody);
      resolve(true);
    }, 1000);
  });
};

/**
 * Generates a pre-formatted WhatsApp message including quotation details and access link.
 */
export const getWhatsAppQuotationMessage = (collab: any): string => {
  const trackingUrl = `${window.location.origin}/share/${collab.id}`;
  const amountPaid = (collab.paymentHistory || []).reduce((sum: number, p: any) => sum + p.amount, 0);
  const amountDue = collab.totalPrice - amountPaid;

  let msg = `*Dear ${collab.contactName || collab.brandName},*\n\n`;
  msg += `Here is your dynamic quotation & collaboration payment breakdown (in *LKR*):\n\n`;
  msg += `*Services Details:*\n`;
  collab.services.forEach((s: any) => {
    msg += `• *${s.serviceName}* (${s.quantity}x) - LKR ${s.lineTotal.toLocaleString()}\n`;
    if (s.sharedDeliverables) {
      msg += `  _Files: ${s.sharedDeliverables}_\n`;
    }
  });

  if (collab.additionalCharges && collab.additionalCharges.length > 0) {
    msg += `\n*Additional Charges:*\n`;
    collab.additionalCharges.forEach((c: any) => {
      msg += `• *${c.name}* - LKR ${c.price.toLocaleString()}\n`;
    });
  }

  msg += `\n-----------------------------\n`;
  msg += `*Total Project Quote:* LKR ${collab.totalPrice.toLocaleString()}\n`;
  msg += `*Amount Paid:* LKR ${amountPaid.toLocaleString()}\n`;
  msg += `*Remaining Balance (Due):* *LKR ${amountDue.toLocaleString()}*\n`;
  msg += `-----------------------------\n\n`;
  msg += `You can review details, view shared files, and approve/track live progress here:\n`;
  msg += `${trackingUrl}\n\n`;
  msg += `Best regards,\n`;
  msg += `*Ranthula Am*`;

  return msg;
};

/**
 * Triggers a WhatsApp tab containing the pre-formatted quotation message.
 */
export const sendWhatsAppQuotation = (collab: any): boolean => {
  const msg = getWhatsAppQuotationMessage(collab);
  const primaryWhatsApp = (collab.whatsappNumbers && collab.whatsappNumbers[0]) || collab.whatsappNumber || '';
  const cleanPhone = primaryWhatsApp.replace(/[^0-9]/g, '');
  
  if (cleanPhone) {
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    return true;
  }
  return false;
};
