
import { useEffect, useRef } from 'react';

interface ElementSelectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isSelectionMode: boolean;
  onElementSelect: (elementInfo: {
    tag: string;
    text: string;
    selector: string;
    position: { x: number; y: number };
  }) => void;
}

export const ElementSelector = ({ iframeRef, isSelectionMode, onElementSelect }: ElementSelectorProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !isSelectionMode) return;

    const iframe = iframeRef.current;
    let iframeDoc: Document;

    const setupSelector = () => {
      try {
        iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Injeta CSS para highlight
        const style = iframeDoc.createElement('style');
        style.textContent = `
          .lovable-selector-highlight {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px !important;
            cursor: pointer !important;
            position: relative !important;
          }
          .lovable-selector-highlight::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(59, 130, 246, 0.1);
            pointer-events: none;
            z-index: 1000;
          }
        `;
        iframeDoc.head.appendChild(style);

        // Adiciona listeners para elementos interativos
        const selectableElements = iframeDoc.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, button, a, span, div, img, input, textarea, label'
        );

        selectableElements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          
          // Adiciona hover effect
          htmlElement.addEventListener('mouseenter', () => {
            htmlElement.classList.add('lovable-selector-highlight');
          });

          htmlElement.addEventListener('mouseleave', () => {
            htmlElement.classList.remove('lovable-selector-highlight');
          });

          // Adiciona click handler
          htmlElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = htmlElement.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();

            // Gera um seletor único
            const generateSelector = (el: HTMLElement): string => {
              if (el.id) return `#${el.id}`;
              
              let selector = el.tagName.toLowerCase();
              
              if (el.className) {
                const classes = el.className.split(' ').filter(c => c && !c.startsWith('lovable-selector'));
                if (classes.length > 0) {
                  selector += '.' + classes.slice(0, 2).join('.');
                }
              }
              
              // Adiciona posição se necessário
              const parent = el.parentElement;
              if (parent) {
                const siblings = Array.from(parent.children).filter(child => 
                  child.tagName === el.tagName && 
                  child.className === el.className
                );
                if (siblings.length > 1) {
                  const index = siblings.indexOf(el);
                  selector += `:nth-child(${index + 1})`;
                }
              }
              
              return selector;
            };

            onElementSelect({
              tag: htmlElement.tagName.toLowerCase(),
              text: htmlElement.textContent?.trim() || '',
              selector: generateSelector(htmlElement),
              position: {
                x: rect.left + iframeRect.left,
                y: rect.top + iframeRect.top
              }
            });

            // Remove highlight após seleção
            htmlElement.classList.remove('lovable-selector-highlight');
          });
        });

      } catch (error) {
        console.error('Erro ao configurar seletor:', error);
      }
    };

    // Aguarda o iframe carregar
    if (iframe.contentDocument?.readyState === 'complete') {
      setupSelector();
    } else {
      iframe.addEventListener('load', setupSelector);
    }

    return () => {
      iframe.removeEventListener('load', setupSelector);
    };
  }, [iframeRef, isSelectionMode, onElementSelect]);

  return null;
};
