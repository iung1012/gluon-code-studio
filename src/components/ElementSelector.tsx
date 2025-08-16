
import { useEffect, useState, useRef } from 'react';
import { cn } from "@/lib/utils";

interface SelectedElement {
  element: HTMLElement;
  selector: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ElementSelectorProps {
  isActive: boolean;
  onElementSelect: (element: SelectedElement | null) => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const ElementSelector = ({ isActive, onElementSelect, iframeRef }: ElementSelectorProps) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  useEffect(() => {
    if (!isActive || !iframeRef.current) {
      setHoveredElement(null);
      setSelectedElement(null);
      onElementSelect(null);
      return;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;

    const handleMouseOver = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      if (target && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
        setHoveredElement(target);
      }
    };

    const handleMouseOut = () => {
      setHoveredElement(null);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      if (target && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
        const rect = target.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        
        const selector = generateSelector(target);
        const elementType = getElementType(target);
        const text = target.textContent?.trim() || target.getAttribute('placeholder') || '';
        
        const selectedEl: SelectedElement = {
          element: target,
          selector,
          type: elementType,
          text,
          position: {
            x: rect.left + iframeRect.left,
            y: rect.top + iframeRect.top,
            width: rect.width,
            height: rect.height
          }
        };
        
        setSelectedElement(selectedEl);
        onElementSelect(selectedEl);
      }
    };

    iframeDoc.addEventListener('mouseover', handleMouseOver);
    iframeDoc.addEventListener('mouseout', handleMouseOut);
    iframeDoc.addEventListener('click', handleClick);

    // Add styles to highlight elements
    const style = iframeDoc.createElement('style');
    style.textContent = `
      .lovable-hover-highlight {
        outline: 2px solid #8b5cf6 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      .lovable-selected-highlight {
        outline: 3px solid #7c3aed !important;
        outline-offset: 2px !important;
        background-color: rgba(139, 92, 246, 0.1) !important;
      }
    `;
    iframeDoc.head.appendChild(style);

    return () => {
      iframeDoc.removeEventListener('mouseover', handleMouseOver);
      iframeDoc.removeEventListener('mouseout', handleMouseOut);
      iframeDoc.removeEventListener('click', handleClick);
      style.remove();
    };
  }, [isActive, iframeRef, onElementSelect]);

  // Update element highlighting
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!iframeDoc) return;

    // Remove all previous highlights
    const prevHighlighted = iframeDoc.querySelectorAll('.lovable-hover-highlight, .lovable-selected-highlight');
    prevHighlighted.forEach(el => {
      el.classList.remove('lovable-hover-highlight', 'lovable-selected-highlight');
    });

    // Add hover highlight
    if (hoveredElement && hoveredElement !== selectedElement?.element) {
      hoveredElement.classList.add('lovable-hover-highlight');
    }

    // Add selected highlight
    if (selectedElement?.element) {
      selectedElement.element.classList.add('lovable-selected-highlight');
    }
  }, [hoveredElement, selectedElement, iframeRef]);

  return null;
};

const generateSelector = (element: HTMLElement): string => {
  if (element.id) return `#${element.id}`;
  
  const classes = Array.from(element.classList).filter(c => !c.startsWith('lovable-'));
  if (classes.length > 0) return `.${classes.join('.')}`;
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tagName;
  
  const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
  if (siblings.length === 1) return tagName;
  
  const index = siblings.indexOf(element) + 1;
  return `${tagName}:nth-of-type(${index})`;
};

const getElementType = (element: HTMLElement): string => {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'button' || (tagName === 'input' && element.getAttribute('type') === 'button')) {
    return 'botão';
  }
  if (tagName === 'a') return 'link';
  if (tagName === 'input') return 'campo de entrada';
  if (tagName === 'textarea') return 'área de texto';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return 'título';
  if (tagName === 'p') return 'parágrafo';
  if (tagName === 'img') return 'imagem';
  if (tagName === 'div') return 'seção';
  if (tagName === 'span') return 'texto';
  
  return 'elemento';
};
