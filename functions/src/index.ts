import {onDocumentCreated, onDocumentUpdated} from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import {defineSecret} from 'firebase-functions/params';

admin.initializeApp();

// Define SendGrid API key as a secret
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

// ===========================
// 1. Send Email When Notification Is Created
// ===========================
export const sendNotificationEmail = onDocumentCreated({
  document: 'notifications/{notificationId}',
  secrets: [sendgridApiKey],
}, async (event) => {
  // Initialize SendGrid
  sgMail.setApiKey(sendgridApiKey.value());
  
  const snap = event.data;
  if (!snap) {
    return null;
  }
    try {
      const notification = snap.data();
      const db = admin.firestore();

      console.log('Notification data:', JSON.stringify(notification));
      console.log('Department:', notification.department);
      console.log('Target roles:', notification.targetRoles);

      // Determine which users to send emails to based on department and roles
      let usersQuery: admin.firestore.Query = db.collection('users');
      
      // If notification has a specific department (not "all"), filter by it
      if (notification.department && notification.department !== 'all') {
        // Super admin with special department sees everything, so skip department filter
        if (notification.department !== 'Administration - All Departments Supervisor') {
          console.log('Filtering by department:', notification.department);
          usersQuery = usersQuery.where('department', '==', notification.department);
        }
      }

      // Filter by target roles
      if (notification.targetRoles && notification.targetRoles.length > 0) {
        console.log('Filtering by roles:', notification.targetRoles);
        // If 'all' is in targetRoles, don't filter by role
        if (!notification.targetRoles.includes('all')) {
          usersQuery = usersQuery.where('role', 'in', notification.targetRoles);
        } else {
          console.log('Target roles includes "all", not filtering by role');
        }
      }

      const usersSnapshot = await usersQuery.get();
      console.log('Users found:', usersSnapshot.size);
      
      if (usersSnapshot.empty) {
        console.log('No users found matching notification criteria');
        return null;
      }

      // Collect all email addresses
      const recipients: string[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email) {
          recipients.push(userData.email);
        }
      });

      if (recipients.length === 0) {
        console.log('No valid email addresses found');
        return null;
      }

      // Create email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .notification-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .priority { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-high { background: #fee; color: #c33; }
            .priority-medium { background: #ffeaa7; color: #d63031; }
            .priority-low { background: #dfe6e9; color: #2d3436; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 New Notification</h1>
            </div>
            <div class="content">
              <div class="notification-card">
                <span class="priority priority-${notification.priority}">${notification.priority?.toUpperCase()}</span>
                <h2>${notification.title}</h2>
                <p>${notification.message}</p>
                <p><strong>Department:</strong> ${notification.department}</p>
                <p><strong>Created:</strong> ${new Date(notification.createdAt.toDate()).toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>
                ${notification.expiresAt ? `<p><strong>Expires:</strong> ${new Date(notification.expiresAt.toDate()).toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>` : ''}
              </div>
              <a href="http://localhost:5173/notifications" class="button">View in Portal</a>
            </div>
            <div class="footer">
              <p>This is an automated message from NCP Portal</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email to all recipients
      const msg = {
        to: recipients,
        from: 'justufor21@gmail.com',
        subject: `📢 New Notification: ${notification.title}`,
        html: emailHtml,
      };

      await sgMail.send(msg);
      console.log(`Notification email sent to ${recipients.length} recipients`);
      
      return null;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return null;
    }
  });

// ===========================
// 2. Send Email When Feedback Is Submitted
// ===========================
export const sendFeedbackSubmittedEmail = onDocumentCreated({
  document: 'feedback/{feedbackId}',
  secrets: [sendgridApiKey],
}, async (event) => {
  // Initialize SendGrid
  sgMail.setApiKey(sendgridApiKey.value());
  
  const snap = event.data;
  if (!snap) {
    return null;
  }
    try {
      const feedback = snap.data();
      const db = admin.firestore();

      console.log('Feedback document ID:', snap.id);
      console.log('Feedback data:', JSON.stringify(feedback));
      console.log('Student ID:', feedback.userId);
      console.log('Student ID type:', typeof feedback.userId);
      console.log('Department:', feedback.department);

      // Get student details
      const studentDoc = await db.collection('users').doc(feedback.userId).get();
      const studentData = studentDoc.data();
      console.log('Student found:', studentDoc.exists, 'Email:', studentData?.email);

      // Find all admins/faculty in the same department
      const adminsQuery = await db.collection('users')
        .where('department', '==', feedback.department)
        .where('role', 'in', ['dept_admin', 'faculty'])
        .get();

      console.log('Admins found:', adminsQuery.size);

      if (adminsQuery.empty) {
        console.log('No admins found for department');
        return null;
      }

      const recipients: string[] = [];
      adminsQuery.forEach((doc) => {
        const userData = doc.data();
        if (userData.email) {
          recipients.push(userData.email);
        }
      });

      if (recipients.length === 0) {
        console.log('No valid admin email addresses found');
        return null;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feedback-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Feedback Submitted</h1>
            </div>
            <div class="content">
              <div class="feedback-card">
                <h2>${feedback.subject}</h2>
                <p>${feedback.message}</p>
                <p><strong>From:</strong> ${studentData?.name || 'Student'} (${studentData?.email || 'N/A'})</p>
                <p><strong>Department:</strong> ${feedback.department}</p>
                <p><strong>Category:</strong> ${feedback.category}</p>
                <p><strong>Submitted:</strong> ${new Date(feedback.createdAt.toDate()).toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>
              </div>
              <a href="http://localhost:5173/feedback" class="button">Reply to Feedback</a>
            </div>
            <div class="footer">
              <p>This is an automated message from NCP Portal</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: recipients,
        from: 'justufor21@gmail.com',
        subject: `💬 New Feedback: ${feedback.subject}`,
        html: emailHtml,
      };

      await sgMail.send(msg);
      console.log(`Feedback notification sent to ${recipients.length} admins`);
      
      return null;
    } catch (error) {
      console.error('Error sending feedback notification:', error);
      return null;
    }
  });

// ===========================
// 3. Send Email When Admin Replies to Feedback
// ===========================
export const sendFeedbackReplyEmail = onDocumentUpdated({
  document: 'feedback/{feedbackId}',
  secrets: [sendgridApiKey],
}, async (event) => {
  // Initialize SendGrid
  sgMail.setApiKey(sendgridApiKey.value());
  
  const change = event.data;
  if (!change) {
    return null;
  }
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if a new response was added
      const beforeResponses = beforeData.responses || [];
      const afterResponses = afterData.responses || [];

      if (afterResponses.length <= beforeResponses.length) {
        return null; // No new response
      }

      const latestResponse = afterResponses[afterResponses.length - 1];
      const db = admin.firestore();

      // Get student details
      const studentDoc = await db.collection('users').doc(afterData.userId).get();
      const studentData = studentDoc.data();

      if (!studentData?.email) {
        console.log('No student email found');
        return null;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reply-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #4facfe; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Admin Reply to Your Feedback</h1>
            </div>
            <div class="content">
              <p>Hello ${studentData.name},</p>
              <p>An administrator has replied to your feedback:</p>
              <div class="reply-card">
                <p><strong>Subject:</strong> ${afterData.subject}</p>
                <p><strong>Reply:</strong> ${latestResponse.message}</p>
                <p><strong>Replied by:</strong> ${latestResponse.respondedByName || 'Admin'}</p>
                <p><strong>Time:</strong> ${new Date(latestResponse.createdAt.toDate()).toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>
              </div>
              <a href="http://localhost:5173/feedback" class="button">View Full Conversation</a>
            </div>
            <div class="footer">
              <p>This is an automated message from NCP Portal</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: studentData.email,
        from: 'justufor21@gmail.com',
        subject: `💬 Reply to Your Feedback: ${afterData.subject}`,
        html: emailHtml,
      };

      await sgMail.send(msg);
      console.log(`Reply notification sent to student: ${studentData.email}`);
      
      return null;
    } catch (error) {
      console.error('Error sending reply notification:', error);
      return null;
    }
  });

// ===========================
// 4. Send Email When Feedback Is Resolved
// ===========================
export const sendFeedbackResolvedEmail = onDocumentUpdated({
  document: 'feedback/{feedbackId}',
  secrets: [sendgridApiKey],
}, async (event) => {
  // Initialize SendGrid
  sgMail.setApiKey(sendgridApiKey.value());
  
  const change = event.data;
  if (!change) {
    return null;
  }
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if status changed to resolved
      if (beforeData.status !== 'resolved' && afterData.status === 'resolved') {
        const db = admin.firestore();

        // Get student details
        const studentDoc = await db.collection('users').doc(afterData.userId).get();
        const studentData = studentDoc.data();

        if (!studentData?.email) {
          console.log('No student email found');
          return null;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .resolved-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #43e97b; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Your Feedback Has Been Resolved</h1>
              </div>
              <div class="content">
                <p>Hello ${studentData.name},</p>
                <p>Great news! Your feedback has been marked as resolved.</p>
                <div class="resolved-card">
                  <p><strong>Subject:</strong> ${afterData.subject}</p>
                  <p><strong>Category:</strong> ${afterData.category}</p>
                  <p><strong>Submitted:</strong> ${new Date(afterData.createdAt.toDate()).toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>
                  <p><strong>Resolved:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'long' })}</p>
                </div>
                <p>Thank you for your patience. If you have any further concerns, feel free to submit new feedback.</p>
                <a href="http://localhost:5173/feedback" class="button">View Feedback History</a>
              </div>
              <div class="footer">
                <p>This is an automated message from NCP Portal</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const msg = {
          to: studentData.email,
          from: 'justufor21@gmail.com',
          subject: `✅ Your Feedback Has Been Resolved: ${afterData.subject}`,
          html: emailHtml,
        };

        await sgMail.send(msg);
        console.log(`Resolution notification sent to student: ${studentData.email}`);
      }
      
      return null;
    } catch (error) {
      console.error('Error sending resolution notification:', error);
      return null;
    }
  });
