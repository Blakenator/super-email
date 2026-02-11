import { useState, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import {
  Card,
  Form,
  Modal,
  ListGroup,
  Spinner,
  Row,
  Col,
  Alert,
} from 'react-bootstrap';
import { Button } from '../../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faPlus,
  faEdit,
  faTrash,
  faPlay,
  faToggleOn,
  faToggleOff,
  faArchive,
  faStar,
  faEnvelopeOpen,
  faTag,
  faShare,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { EmailChipInput, TagSelector } from '../../../core/components';
import {
  GET_MAIL_RULES_QUERY,
  CREATE_MAIL_RULE_MUTATION,
  UPDATE_MAIL_RULE_MUTATION,
  DELETE_MAIL_RULE_MUTATION,
  PREVIEW_MAIL_RULE_QUERY,
  RUN_MAIL_RULE_MUTATION,
  GET_TAGS_QUERY,
} from '../queries';
import {
  RuleListItem,
  RuleHeader,
  RuleName,
  RuleDescription,
  RuleDetails,
  RuleCondition,
  RuleAction,
  RuleActions,
  SectionTitle,
} from './MailRulesManager.wrappers';

interface RuleFormData {
  name: string;
  description: string;
  emailAccountId: string;
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
  emailAccountId: '',
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

export function MailRulesManager() {
  const [showModal, setShowModal] = useState(false);
  const [showRunConfirmModal, setShowRunConfirmModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(emptyFormData);

  const { data, loading } = useQuery(GET_MAIL_RULES_QUERY);
  const { data: tagsData } = useQuery(GET_TAGS_QUERY);
  const rules = data?.getMailRules ?? [];
  const tags = tagsData?.getTags ?? [];

  const [previewRule, { loading: previewing, data: previewData, error: previewError }] = useLazyQuery(
    PREVIEW_MAIL_RULE_QUERY,
    {
      fetchPolicy: 'network-only', // Always fetch fresh data
    },
  );

  // Handle preview query result with useEffect
  useEffect(() => {
    if (previewData?.previewMailRule !== undefined && selectedRuleId) {
      setPreviewCount(previewData.previewMailRule);
      setShowRunConfirmModal(true);
    }
  }, [previewData, selectedRuleId]);

  useEffect(() => {
    if (previewError) {
      toast.error(`Preview failed: ${previewError.message}`);
    }
  }, [previewError]);

  const [createRule, { loading: creating }] = useMutation(
    CREATE_MAIL_RULE_MUTATION,
    {
      refetchQueries: [{ query: GET_MAIL_RULES_QUERY }],
      onCompleted: () => {
        toast.success('Rule created');
        handleCloseModal();
      },
      onError: (err) => toast.error(`Failed to create rule: ${err.message}`),
    },
  );

  const [updateRule, { loading: updating }] = useMutation(
    UPDATE_MAIL_RULE_MUTATION,
    {
      refetchQueries: [{ query: GET_MAIL_RULES_QUERY }],
      onCompleted: () => {
        toast.success('Rule updated');
        handleCloseModal();
      },
      onError: (err) => toast.error(`Failed to update rule: ${err.message}`),
    },
  );

  const [deleteRule] = useMutation(DELETE_MAIL_RULE_MUTATION, {
    refetchQueries: [{ query: GET_MAIL_RULES_QUERY }],
    onCompleted: () => toast.success('Rule deleted'),
    onError: (err) => toast.error(`Failed to delete rule: ${err.message}`),
  });

  const [runRule, { loading: running }] = useMutation(RUN_MAIL_RULE_MUTATION, {
    onCompleted: (data) => {
      toast.success(
        `Rule applied to ${data.runMailRule.processedCount} emails`,
      );
      setShowRunConfirmModal(false);
    },
    onError: (err) => toast.error(`Failed to run rule: ${err.message}`),
  });

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: typeof rules[0]) => {
    setEditingRule(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      emailAccountId: rule.emailAccountId || '',
      conditions: {
        fromContains: rule.conditions.fromContains || '',
        toContains: rule.conditions.toContains || '',
        ccContains: rule.conditions.ccContains || '',
        bccContains: rule.conditions.bccContains || '',
        subjectContains: rule.conditions.subjectContains || '',
        bodyContains: rule.conditions.bodyContains || '',
      },
      actions: {
        archive: rule.actions.archive || false,
        star: rule.actions.star || false,
        delete: rule.actions.delete || false,
        markRead: rule.actions.markRead || false,
        addTagIds: rule.actions.addTagIds || [],
        forwardTo: rule.actions.forwardTo || '',
      },
      isEnabled: rule.isEnabled,
      priority: rule.priority,
      stopProcessing: rule.stopProcessing,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setFormData(emptyFormData);
  };

  const handleRunRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setPreviewCount(null);
    void previewRule({ variables: { id: ruleId } });
  };

  const confirmRunRule = () => {
    if (selectedRuleId) {
      void runRule({ variables: { id: selectedRuleId } });
    }
  };

  const handleToggleEnabled = (rule: typeof rules[0]) => {
    void updateRule({
      variables: {
        input: {
          id: rule.id,
          isEnabled: !rule.isEnabled,
        },
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    // Check if at least one condition is set
    const hasCondition = Object.values(formData.conditions).some(
      (v) => v.trim() !== '',
    );
    if (!hasCondition) {
      toast.error('At least one condition is required');
      return;
    }

    // Check if at least one action is set
    const hasAction =
      formData.actions.archive ||
      formData.actions.star ||
      formData.actions.delete ||
      formData.actions.markRead ||
      formData.actions.addTagIds.length > 0 ||
      formData.actions.forwardTo.trim() !== '';
    if (!hasAction) {
      toast.error('At least one action is required');
      return;
    }

    const input = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      emailAccountId: formData.emailAccountId || null,
      conditions: {
        fromContains: formData.conditions.fromContains.trim() || null,
        toContains: formData.conditions.toContains.trim() || null,
        ccContains: formData.conditions.ccContains.trim() || null,
        bccContains: formData.conditions.bccContains.trim() || null,
        subjectContains: formData.conditions.subjectContains.trim() || null,
        bodyContains: formData.conditions.bodyContains.trim() || null,
      },
      actions: {
        archive: formData.actions.archive || null,
        star: formData.actions.star || null,
        delete: formData.actions.delete || null,
        markRead: formData.actions.markRead || null,
        addTagIds:
          formData.actions.addTagIds.length > 0
            ? formData.actions.addTagIds
            : null,
        forwardTo: formData.actions.forwardTo.trim() || null,
      },
      isEnabled: formData.isEnabled,
      priority: formData.priority,
      stopProcessing: formData.stopProcessing,
    };

    if (editingRule) {
      void updateRule({ variables: { input: { id: editingRule, ...input } } });
    } else {
      void createRule({ variables: { input } });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      void deleteRule({ variables: { id } });
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
          <span className="ms-2">Loading rules...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Mail Rules
          </span>
          <Button
            size="sm"
            variant="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={handleOpenCreateModal}
          >
            New Rule
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {rules.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No rules yet. Create one to automatically process incoming emails.
            </div>
          ) : (
            <ListGroup variant="flush">
              {rules.map((rule) => (
                <RuleListItem key={rule.id} className="list-group-item">
                  <RuleHeader>
                    <div>
                      <RuleName>
                        <FontAwesomeIcon
                          icon={rule.isEnabled ? faToggleOn : faToggleOff}
                          className={`me-2 ${rule.isEnabled ? 'text-success' : 'text-muted'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleEnabled(rule)}
                        />
                        {rule.name}
                      </RuleName>
                      {rule.description && (
                        <RuleDescription>{rule.description}</RuleDescription>
                      )}
                    </div>
                    <RuleActions>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        icon={<FontAwesomeIcon icon={faPlay} />}
                        onClick={() => handleRunRule(rule.id)}
                        title="Run rule on all emails"
                      />
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        icon={<FontAwesomeIcon icon={faEdit} />}
                        onClick={() => handleOpenEditModal(rule)}
                      />
                      <Button
                        size="sm"
                        variant="outline-danger"
                        icon={<FontAwesomeIcon icon={faTrash} />}
                        onClick={() => handleDelete(rule.id, rule.name)}
                      />
                    </RuleActions>
                  </RuleHeader>
                  <RuleDetails>
                    {rule.conditions.fromContains && (
                      <RuleCondition className="badge bg-info">
                        From: {rule.conditions.fromContains}
                      </RuleCondition>
                    )}
                    {rule.conditions.toContains && (
                      <RuleCondition className="badge bg-info">
                        To: {rule.conditions.toContains}
                      </RuleCondition>
                    )}
                    {rule.conditions.subjectContains && (
                      <RuleCondition className="badge bg-info">
                        Subject: {rule.conditions.subjectContains}
                      </RuleCondition>
                    )}
                    {rule.conditions.bodyContains && (
                      <RuleCondition className="badge bg-info">
                        Body: {rule.conditions.bodyContains}
                      </RuleCondition>
                    )}
                    <span className="text-muted">→</span>
                    {rule.actions.archive && (
                      <RuleAction className="badge bg-secondary">
                        <FontAwesomeIcon icon={faArchive} className="me-1" />
                        Archive
                      </RuleAction>
                    )}
                    {rule.actions.star && (
                      <RuleAction className="badge bg-warning text-dark">
                        <FontAwesomeIcon icon={faStar} className="me-1" />
                        Star
                      </RuleAction>
                    )}
                    {rule.actions.markRead && (
                      <RuleAction className="badge bg-secondary">
                        <FontAwesomeIcon
                          icon={faEnvelopeOpen}
                          className="me-1"
                        />
                        Mark Read
                      </RuleAction>
                    )}
                    {rule.actions.delete && (
                      <RuleAction className="badge bg-danger">
                        <FontAwesomeIcon icon={faTrash} className="me-1" />
                        Delete
                      </RuleAction>
                    )}
                    {rule.actions.addTagIds &&
                      rule.actions.addTagIds.length > 0 && (
                        <RuleAction className="badge bg-primary">
                          <FontAwesomeIcon icon={faTag} className="me-1" />
                          Add Tags
                        </RuleAction>
                      )}
                    {rule.actions.forwardTo && (
                      <RuleAction className="badge bg-primary">
                        <FontAwesomeIcon icon={faShare} className="me-1" />
                        Forward
                      </RuleAction>
                    )}
                  </RuleDetails>
                </RuleListItem>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </Modal.Title>
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
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, fromContains: value },
                      })
                    }
                    placeholder="Filter by sender..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>To contains</Form.Label>
                  <EmailChipInput
                    value={formData.conditions.toContains}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, toContains: value },
                      })
                    }
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
                    placeholder="e.g., Newsletter"
                    value={formData.conditions.subjectContains}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          subjectContains: e.target.value,
                        },
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Body contains</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., unsubscribe"
                    value={formData.conditions.bodyContains}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          bodyContains: e.target.value,
                        },
                      })
                    }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        archive: e.target.checked,
                      },
                    })
                  }
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  id="action-star"
                  label="Star email"
                  checked={formData.actions.star}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: { ...formData.actions, star: e.target.checked },
                    })
                  }
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  id="action-markread"
                  label="Mark as read"
                  checked={formData.actions.markRead}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        markRead: e.target.checked,
                      },
                    })
                  }
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  id="action-delete"
                  label="Delete email"
                  checked={formData.actions.delete}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        delete: e.target.checked,
                      },
                    })
                  }
                  className="mb-2"
                />
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Add tags</Form.Label>
                  <TagSelector
                    tags={tags}
                    selectedTagIds={formData.actions.addTagIds}
                    onToggleTag={(tagId) => {
                      const tagIds = formData.actions.addTagIds.includes(tagId)
                        ? formData.actions.addTagIds.filter((id) => id !== tagId)
                        : [...formData.actions.addTagIds, tagId];
                      setFormData({
                        ...formData,
                        actions: { ...formData.actions, addTagIds: tagIds },
                      });
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Forward to</Form.Label>
                  <EmailChipInput
                    value={formData.actions.forwardTo}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        actions: { ...formData.actions, forwardTo: value },
                      })
                    }
                    placeholder="Forward to email..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <SectionTitle>Options</SectionTitle>
            <Form.Check
              type="checkbox"
              id="stop-processing"
              label="Stop processing other rules after this one matches"
              checked={formData.stopProcessing}
              onChange={(e) =>
                setFormData({ ...formData, stopProcessing: e.target.checked })
              }
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={creating || updating}
            >
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Run Rule Confirmation Modal */}
      <Modal
        show={showRunConfirmModal}
        onHide={() => setShowRunConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Run Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewing ? (
            <div className="text-center py-3">
              <Spinner animation="border" />
              <p className="mt-2">Counting matching emails...</p>
            </div>
          ) : (
            <>
              <Alert variant="info">
                This rule will be applied to{' '}
                <strong>{previewCount ?? 0} emails</strong> in your inbox.
              </Alert>
              <p>
                Are you sure you want to run this rule? This action cannot be
                undone.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRunConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmRunRule}
            disabled={running || previewing || previewCount === 0}
          >
            {running ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Running...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlay} className="me-1" />
                Run Rule
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
