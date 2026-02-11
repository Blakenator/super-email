import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
  toggle: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  drop?: 'up' | 'down';
}

export function PortalDropdown({
  toggle,
  children,
  align = 'end',
  drop = 'up',
}: PortalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && toggleRef.current) {
      const updatePosition = () => {
        if (!toggleRef.current) return;

        const rect = toggleRef.current.getBoundingClientRect();
        const menuWidth = 240; // min-width from UserPopoverMenu
        const menuHeight = 400; // approximate height

        let top: number;
        let left: number;

        if (drop === 'up') {
          // Position above the toggle
          top = rect.top - menuHeight - 8; // 8px gap
        } else {
          // Position below the toggle
          top = rect.bottom + 8; // 8px gap
        }

        if (align === 'end') {
          // Align to the right edge of toggle
          left = rect.right - menuWidth;
        } else {
          // Align to the left edge of toggle
          left = rect.left;
        }

        // Ensure menu stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 8) {
          left = 8; // 8px padding from viewport edge
        } else if (left + menuWidth > viewportWidth - 8) {
          left = viewportWidth - menuWidth - 8;
        }

        if (top < 8) {
          // If menu would be cut off at top, flip to bottom
          top = rect.bottom + 8;
        } else if (top + menuHeight > viewportHeight - 8) {
          // If menu would be cut off at bottom, flip to top
          top = rect.top - menuHeight - 8;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, align, drop]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (
        toggleRef.current &&
        menuRef.current &&
        !toggleRef.current.contains(target) &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleToggleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      <div
        ref={toggleRef}
        onClick={handleToggleClick}
        style={{ width: '100%' }}
      >
        {toggle}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 1050,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
