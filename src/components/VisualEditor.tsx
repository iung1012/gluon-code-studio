import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wand2, Type, Palette, Image as ImageIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VisualEditorProps {
  isActive: boolean;
  onEditElement: (elementInfo: ElementInfo, prompt: string) => void;
}

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  path: string;
}

export const VisualEditor = ({ isActive, onEditElement }: VisualEditorProps) => {
  const [selectedElement, setSelectedElement] = useState<{
    element: HTMLElement;
    info: ElementInfo;
    position: { x: number; y: number };
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isActive) {
      setSelectedElement(null);
      return;
    }

    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target) return;

      // Get element path
      const path = getElementPath(target);
      
      const info: ElementInfo = {
        tagName: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id,
        textContent: target.textContent?.substring(0, 100) || '',
        path
      };

      const rect = target.getBoundingClientRect();
      const iframeRect = iframe.getBoundingClientRect();

      setSelectedElement({
        element: target,
        info,
        position: {
          x: iframeRect.left + rect.left,
          y: iframeRect.top + rect.top
        }
      });

      // Highlight element
      target.style.outline = '2px solid #8B5CF6';
      target.style.outlineOffset = '2px';
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!iframeDoc.contains(target)) {
        if (selectedElement) {
          selectedElement.element.style.outline = '';
          selectedElement.element.style.outlineOffset = '';
        }
        setSelectedElement(null);
      }
    };

    iframeDoc.addEventListener('click', handleElementClick);
    document.addEventListener('click', handleClickOutside);

    return () => {
      iframeDoc.removeEventListener('click', handleElementClick);
      document.removeEventListener('click', handleClickOutside);
      if (selectedElement) {
        selectedElement.element.style.outline = '';
        selectedElement.element.style.outlineOffset = '';
      }
    };
  }, [isActive, selectedElement]);

  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.tagName !== 'BODY') {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  };

  const handleQuickEdit = (type: 'text' | 'color' | 'image') => {
    if (!selectedElement) return;

    let prompt = '';
    const elementDesc = `elemento ${selectedElement.info.tagName}${
      selectedElement.info.className ? ` com classe ${selectedElement.info.className}` : ''
    }`;

    switch (type) {
      case 'text':
        prompt = `Altere o texto do ${elementDesc} para: `;
        break;
      case 'color':
        prompt = `Mude a cor do ${elementDesc} para: `;
        break;
      case 'image':
        prompt = `Substitua a imagem no ${elementDesc} por: `;
        break;
    }

    setEditPrompt(prompt);
    toast({
      title: "Modo de edição rápida ativado",
      description: `Complete a instrução para o ${elementDesc}`,
    });
  };

  const handleSendEdit = () => {
    if (!selectedElement || !editPrompt.trim()) return;

    onEditElement(selectedElement.info, editPrompt);
    setEditPrompt('');
    
    if (selectedElement.element) {
      selectedElement.element.style.outline = '';
      selectedElement.element.style.outlineOffset = '';
    }
    setSelectedElement(null);

    toast({
      title: "Modificação enviada",
      description: "A IA está processando sua solicitação...",
    });
  };

  if (!isActive) return null;

  return (
    <>
      {/* Floating toolbar when element is selected */}
      {selectedElement && (
        <div
          className="fixed z-50 bg-white border-2 border-purple-500 rounded-lg shadow-2xl p-4 min-w-[320px]"
          style={{
            left: `${selectedElement.position.x}px`,
            top: `${selectedElement.position.y - 200}px`,
          }}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2 pb-2 border-b">
              <Wand2 className="w-4 h-4 text-purple-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedElement.info.tagName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedElement.info.className || 'Sem classe'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickEdit('text')}
                className="flex-1"
              >
                <Type className="w-3 h-3 mr-1" />
                Texto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickEdit('color')}
                className="flex-1"
              >
                <Palette className="w-3 h-3 mr-1" />
                Cor
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickEdit('image')}
                className="flex-1"
              >
                <ImageIcon className="w-3 h-3 mr-1" />
                Imagem
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ou descreva a mudança:</Label>
              <div className="flex gap-2">
                <Input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Ex: mude a cor para azul"
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendEdit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSendEdit}
                  disabled={!editPrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Modo de edição ativo - Clique em qualquer elemento
        </p>
      </div>
    </>
  );
};