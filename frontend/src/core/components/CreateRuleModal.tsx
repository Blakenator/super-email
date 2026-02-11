import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Row, Col } from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { EmailChipInput } from './EmailChipInput';
import { TagSelector } from './TagSelector';
import { Button } from './Button';
import { GET_TAGS_QUERY, CREATE_MAIL_RULE_MUTATION } from '../../pages/settings/queries';
import { SectionTitle } from '../../pages/settings/components/MailRulesManager.wrappers';

interface RuleFormData {
  name: string;
  description: string;
  conditions: {
    fromContains: string;
    toContains: string;
    ccContains: string;
    bccContains: string;
    subjectContains: string;
    bodyContains: string;
  };
  actions: {
    archive: boolean;
    star: boolean;
    delete: boolean;
    markRead: boolean;
    addTagIds: string[];
    forwardTo: string;
  };
  isEnabled: boolean;
  priority: number;
  stopProcessing: boolean;
}

const emptyFormData: RuleFormData = {
  name: '',
  description: '',
  conditions: {
    fromContains: '',
    toContains: '',
    ccContains: '',
    bccContains: '',
    subjectContains: '',
    bodyContains: '',
  },
  actions: {
    archive: false,
    star: false,
    delete: false,
    markRead: false,
    addTagIds: [],
    forwardTo: '',
  },
  isEnabled: true,
  priority: 0,
  stopProcessing: false,
};

interface CreateRuleModalProps {
  show: boolean;
  onHide: () => void;
  initialData?: {
    name?: string;
    description?: string;
    conditions?: Partial<RuleFormData['conditions']>;
    actions?: Partial<RuleFormData['actions']>;
  };
  onSuccess?: () => void;
}

export function CreateRuleModal({
  show,
  onHide,
  initialData,
  onSuccess,
}: CreateRuleModalProps) {
  const [formData, setFormData] = useState<RuleFormData>(emptyFormData);
  const { data: tagsData } = useQuery(GET_TAGS_QUERY);
  const availableTags = tagsData?.getTags ?? [];

  const [createRule, { loading }] = useMutation(CREATE_MAIL_RULE_MUTATION, {
    refetchQueries: ['GetMailRules'],
    onCompleted: () => {
      toast.success('Rule created successfully!');
      onSuccess?.();
      onHide();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  useEffect(() => {
    if (show) {
      setFormData({
        ...emptyFormData,
        name: initialData?.name || '',
        description: initialData?.description || '',
        conditions: {
          ...emptyFormData.conditions,
          ...initialData?.conditions,
        },
        actions: {
          ...emptyFormData.actions,
          ...initialData?.actions,
        },
      });
    }
  }, [show, initialData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void createRule({
        variables: {
          input: {
            name: formData.name,
            description: formData.description,
            conditions: formData.conditions,
            actions: formData.actions,
            isEnabled: formData.isEnabled,
            priority: formData.priority,
            stopProcessing: formData.stopProcessing,
          },
        },
      });
    },
    [createRule, formData],
  );

  const updateCondition = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: { ...prev.conditions, [field]: value },
    }));
  };

  const toggleAction = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      actions: { ...prev.actions, [field]: !prev.actions[field as keyof typeof prev.actions] },
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => {
      const currentTags = prev.actions.addTagIds;
      if (currentTags.includes(tagId)) {
        return {
          ...prev,
          actions: {
            ...prev.actions,
            addTagIds: currentTags.filter((id) => id !== tagId),
          },
        };
      } else {
        return {
          ...prev,
          actions: { ...prev.actions, addTagIds: [...currentTags, tagId] },
        };
      }
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Rule Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Archive newsletters"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Form.Text className="text-muted">
                  Lower = higher priority
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Form.Group>

          <SectionTitle>Conditions (match all)</SectionTitle>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>From contains</Form.Label>
                <EmailChipInput
                  value={formData.conditions.fromContains}
                  onChange={(value) => updateCondition('fromContains', value)}
                  placeholder="Filter by sender..."
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>To contains</Form.Label>
                <EmailChipInput
                  value={formData.conditions.toContains}
                  onChange={(value) => updateCondition('toContains', value)}
                  placeholder="Filter by recipient..."
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subject contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., Newsletter"
                  value={formData.conditions.subjectContains}
                  onChange={(e) => updateCondition('subjectContains', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Body contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., unsubscribe"
                  value={formData.conditions.bodyContains}
                  onChange={(e) => updateCondition('bodyContains', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <SectionTitle>Actions (select at least one)</SectionTitle>
          <Row>
            <Col md={6}>
              <Form.Check
                type="checkbox"
                id="action-archive"
                label="Archive email"
                checked={formData.actions.archive}
                onChange={() => toggleAction('archive')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="action-star"
                label="Star email"
                checked={formData.actions.star}
                onChange={() => toggleAction('star')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="action-markread"
                label="Mark as read"
                checked={formData.actions.markRead}
                onChange={() => toggleAction('markRead')}
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                id="action-delete"
                label="Delete email"
                checked={formData.actions.delete}
                onChange={() => toggleAction('delete')}
                className="mb-2"
              />
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Add Tags</Form.Label>
                <TagSelector
                  tags={availableTags}
                  selectedTagIds={formData.actions.addTagIds}
                  onToggleTag={toggleTag}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Forward to (email address)</Form.Label>
                <EmailChipInput
                  value={formData.actions.forwardTo}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      actions: { ...prev.actions, forwardTo: value },
                    }))
                  }
                  placeholder="e.g., me@example.com"
                />
              </Form.Group>
            </Col>
          </Row>

          <SectionTitle>Settings</SectionTitle>
          <Form.Check
            type="checkbox"
            id="rule-enabled"
            label="Rule is enabled"
            checked={formData.isEnabled}
            onChange={(e) =>
              setFormData({ ...formData, isEnabled: e.target.checked })
            }
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            id="rule-stop-processing"
            label="Stop processing other rules after this one"
            checked={formData.stopProcessing}
            onChange={(e) =>
              setFormData({ ...formData, stopProcessing: e.target.checked })
            }
            className="mb-2"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create Rule
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
