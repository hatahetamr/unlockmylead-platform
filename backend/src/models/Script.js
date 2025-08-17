/**
 * Script Data Model for Firestore
 * Defines the structure and validation for AI agent scripts
 */

class Script {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || 'call'; // 'call', 'sms', 'email'
    this.industry = data.industry || '';
    this.language = data.language || 'en';
    this.tone = data.tone || 'professional'; // 'professional', 'casual', 'friendly', 'assertive'
    this.objective = data.objective || ''; // 'lead_generation', 'appointment_setting', 'follow_up', 'survey'
    this.content = data.content || {
      opening: '',
      main_points: [],
      objection_handling: {},
      closing: '',
      fallback_responses: []
    };
    this.variables = data.variables || []; // Dynamic variables like {firstName}, {companyName}
    this.settings = data.settings || {
      max_duration: 300, // seconds for calls
      retry_attempts: 3,
      voice_settings: {
        voice_id: 'en-US-Standard-A',
        speed: 1.0,
        pitch: 0.0
      },
      ai_behavior: {
        interruption_handling: true,
        sentiment_adaptation: true,
        conversation_flow: 'adaptive' // 'strict', 'adaptive', 'free_form'
      }
    };
    this.performance_metrics = data.performance_metrics || {
      total_uses: 0,
      success_rate: 0,
      average_duration: 0,
      conversion_rate: 0,
      last_used: null
    };
    this.tags = data.tags || [];
    this.status = data.status || 'draft'; // 'draft', 'active', 'archived'
    this.created_by = data.created_by || '';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.version = data.version || 1;
    this.parent_script_id = data.parent_script_id || null; // For script versioning
  }

  /**
   * Validate script data
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Script name is required');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Script name must be less than 100 characters');
    }

    if (!['call', 'sms', 'email'].includes(this.type)) {
      errors.push('Script type must be call, sms, or email');
    }

    if (!['professional', 'casual', 'friendly', 'assertive'].includes(this.tone)) {
      errors.push('Invalid tone specified');
    }

    if (!['draft', 'active', 'archived'].includes(this.status)) {
      errors.push('Invalid status specified');
    }

    if (this.type === 'call' && !this.content.opening) {
      errors.push('Opening script is required for call scripts');
    }

    if (this.type === 'sms' && (!this.content.main_points || this.content.main_points.length === 0)) {
      errors.push('Main points are required for SMS scripts');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to Firestore document format
   */
  toFirestore() {
    const data = { ...this };
    delete data.id; // Firestore handles IDs separately
    return data;
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Script({
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      performance_metrics: {
        ...data.performance_metrics,
        last_used: data.performance_metrics?.last_used?.toDate() || null
      }
    });
  }

  /**
   * Get script template based on type and objective
   */
  static getTemplate(type, objective) {
    const templates = {
      call: {
        lead_generation: {
          opening: "Hi {firstName}, this is {agentName} from {companyName}. I hope I'm not catching you at a bad time?",
          main_points: [
            "I'm reaching out because we help companies like {companyName} {value_proposition}",
            "I'd love to share how we've helped similar businesses {specific_benefit}",
            "Would you be open to a brief 15-minute conversation to explore this?"
          ],
          objection_handling: {
            "not_interested": "I understand, {firstName}. Many of our best clients said the same thing initially. What if I could show you {specific_result} in just 10 minutes?",
            "too_busy": "I completely understand you're busy. That's exactly why this could be valuable - it's designed to {time_saving_benefit}. When would be a better time?",
            "already_have_solution": "That's great that you have something in place. I'm curious, how well is it working for {specific_pain_point}?"
          },
          closing: "Perfect! I'll send you a calendar link right after this call. Looking forward to our conversation, {firstName}."
        },
        appointment_setting: {
          opening: "Hi {firstName}, this is {agentName} calling about your interest in {service}.",
          main_points: [
            "I wanted to follow up on your inquiry and see if you had any questions",
            "Based on what you shared, I think we could really help with {specific_need}",
            "I'd like to schedule a time for you to speak with one of our specialists"
          ],
          objection_handling: {
            "need_to_think": "Of course, this is an important decision. What specific concerns do you have that I might be able to address?",
            "need_spouse_approval": "That makes perfect sense. Would it be helpful if your spouse joined the call so they can hear the details too?"
          },
          closing: "Great! Let me get you scheduled. What works better for you, mornings or afternoons?"
        }
      },
      sms: {
        lead_generation: {
          main_points: [
            "Hi {firstName}! {agentName} from {companyName}. Saw your business and thought you might be interested in {value_proposition}.",
            "We've helped similar companies {specific_benefit}. Worth a quick chat?",
            "Reply YES for more info or STOP to opt out."
          ]
        },
        follow_up: {
          main_points: [
            "Hi {firstName}, following up on our conversation about {topic}.",
            "Did you have a chance to {specific_action}?",
            "Happy to answer any questions. Reply or call {phone_number}."
          ]
        }
      },
      email: {
        lead_generation: {
          opening: "Hi {firstName},",
          main_points: [
            "I hope this email finds you well. I'm reaching out because {reason_for_contact}.",
            "We specialize in helping companies like {companyName} {value_proposition}.",
            "I'd love to share how we've helped {similar_company} achieve {specific_result}."
          ],
          closing: "Would you be open to a brief call to discuss how this might benefit {companyName}?\n\nBest regards,\n{agentName}"
        }
      }
    };

    return templates[type]?.[objective] || null;
  }

  /**
   * Extract variables from script content
   */
  extractVariables() {
    const content = JSON.stringify(this.content);
    const variableRegex = /\{([^}]+)\}/g;
    const variables = new Set();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Replace variables in script content
   */
  replaceVariables(variableValues = {}) {
    const replaceInString = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(/\{([^}]+)\}/g, (match, variable) => {
        return variableValues[variable] || match;
      });
    };

    const replaceInObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => replaceInObject(item));
      } else if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceInObject(value);
        }
        return result;
      } else if (typeof obj === 'string') {
        return replaceInString(obj);
      }
      return obj;
    };

    return {
      ...this,
      content: replaceInObject(this.content)
    };
  }

  /**
   * Update performance metrics
   */
  updateMetrics(metrics = {}) {
    this.performance_metrics = {
      ...this.performance_metrics,
      ...metrics,
      last_used: new Date()
    };
    this.updated_at = new Date();
  }

  /**
   * Create a new version of the script
   */
  createVersion() {
    return new Script({
      ...this,
      id: null,
      version: this.version + 1,
      parent_script_id: this.id,
      created_at: new Date(),
      updated_at: new Date(),
      performance_metrics: {
        total_uses: 0,
        success_rate: 0,
        average_duration: 0,
        conversion_rate: 0,
        last_used: null
      }
    });
  }
}

module.exports = Script;
