import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Card,
  Button,
  Form,
  Modal,
  Badge,
  ListGroup,
  Spinner,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faPlus,
  faEdit,
  faTrash,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  GET_TAGS_QUERY,
  CREATE_TAG_MUTATION,
  UPDATE_TAG_MUTATION,
  DELETE_TAG_MUTATION,
} from '../queries';
import {
  TagListItem,
  TagInfo,
  TagColorDot,
  TagName,
  TagDescription,
  EmailCount,
  TagActions,
  ColorPicker,
  ColorOption,
} from './TagsManager.wrappers';

const PRESET_COLORS = [
  '#dc3545', // red
  '#fd7e14', // orange
  '#ffc107', // yellow
  '#28a745', // green
  '#17a2b8', // teal
  '#007bff', // blue
  '#6f42c1', // purple
  '#e83e8c', // pink
  '#6c757d', // gray
  '#343a40', // dark
];

interface TagFormData {
  name: string;
  color: string;
  description: string;
}

export function TagsManager() {
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<{
    id: string;
    name: string;
    color: string;
    description: string | null;
  } | null>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: PRESET_COLORS[5],
    description: '',
  });

  const { data, loading } = useQuery(GET_TAGS_QUERY);
  const tags = data?.getTags ?? [];

  const [createTag, { loading: creating }] = useMutation(CREATE_TAG_MUTATION, {
    refetchQueries: [{ query: GET_TAGS_QUERY }],
    onCompleted: () => {
      toast.success('Tag created');
      handleCloseModal();
    },
    onError: (err) => toast.error(`Failed to create tag: ${err.message}`),
  });

  const [updateTag, { loading: updating }] = useMutation(UPDATE_TAG_MUTATION, {
    refetchQueries: [{ query: GET_TAGS_QUERY }],
    onCompleted: () => {
      toast.success('Tag updated');
      handleCloseModal();
    },
    onError: (err) => toast.error(`Failed to update tag: ${err.message}`),
  });

  const [deleteTag] = useMutation(DELETE_TAG_MUTATION, {
    refetchQueries: [{ query: GET_TAGS_QUERY }],
    onCompleted: () => toast.success('Tag deleted'),
    onError: (err) => toast.error(`Failed to delete tag: ${err.message}`),
  });

  const handleOpenCreateModal = () => {
    setEditingTag(null);
    setFormData({ name: '', color: PRESET_COLORS[5], description: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (tag: typeof tags[0]) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: PRESET_COLORS[5], description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    if (editingTag) {
      updateTag({
        variables: {
          input: {
            id: editingTag.id,
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || null,
          },
        },
      });
    } else {
      createTag({
        variables: {
          input: {
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || null,
          },
        },
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the tag "${name}"?`)) {
      deleteTag({ variables: { id } });
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
          <span className="ms-2">Loading tags...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <FontAwesomeIcon icon={faTag} className="me-2" />
            Tags
          </span>
          <Button size="sm" variant="primary" onClick={handleOpenCreateModal}>
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            New Tag
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {tags.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No tags yet. Create one to organize your emails.
            </div>
          ) : (
            <ListGroup variant="flush">
              {tags.map((tag) => (
                <TagListItem key={tag.id}>
                  <TagInfo>
                    <TagColorDot $color={tag.color} />
                    <TagName>{tag.name}</TagName>
                    {tag.description && (
                      <TagDescription>{tag.description}</TagDescription>
                    )}
                    <EmailCount bg="secondary">
                      <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                      {tag.emailCount}
                    </EmailCount>
                  </TagInfo>
                  <TagActions>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleOpenEditModal(tag)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(tag.id, tag.name)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </TagActions>
                </TagListItem>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Important, Work, Personal"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <ColorPicker>
                {PRESET_COLORS.map((color) => (
                  <ColorOption
                    key={color}
                    type="button"
                    $color={color}
                    $selected={formData.color === color}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </ColorPicker>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Optional description for this tag"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>

            <div className="mt-3">
              <strong>Preview:</strong>
              <div className="mt-2">
                <Badge
                  bg=""
                  style={{
                    backgroundColor: formData.color,
                    color: 'white',
                    fontSize: '0.9rem',
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  {formData.name || 'Tag Name'}
                </Badge>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creating || updating}
            >
              {creating || updating ? (
                <Spinner animation="border" size="sm" />
              ) : editingTag ? (
                'Update Tag'
              ) : (
                'Create Tag'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
