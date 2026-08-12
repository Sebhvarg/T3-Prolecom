import urllib.request
import json

token = "REMOVED_TOKEN"
file_id = "piHdMcpywqzdaCn0MaGbNv"

def analyze_node(node, level=0):
    node_type = node.get('type')
    node_name = node.get('name', '')
    result = []
    
    if node_type in ['FRAME', 'COMPONENT', 'COMPONENT_SET']:
        info = {
            'id': node.get('id'),
            'type': node_type,
            'name': node_name,
        }
        
        texts = []
        find_texts(node, texts)
        if texts:
            info['texts'] = list(set(texts))[:20]
            
        result.append(info)
        return result
        
    for child in node.get('children', []):
        result.extend(analyze_node(child, level + 1))
        
    return result

def find_texts(node, texts_list):
    if node.get('type') == 'TEXT':
        text_val = node.get('characters', '').strip()
        if text_val and len(text_val) > 2:
            texts_list.append(text_val)
    for child in node.get('children', []):
        find_texts(child, texts_list)

url = f"https://api.figma.com/v1/files/{file_id}"
req = urllib.request.Request(url)
req.add_header("X-Figma-Token", token)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
    
    document = data.get('document', {})
    summary = {}
    
    for page in document.get('children', []):
        page_name = page.get('name', '')
        if page_name in ["Estudiante", "Profesor", "Administrador", "Ayudante", "Componentes_General", "Componentes_Estudiantes", "Componentes_Profesor"]:
            page_nodes = []
            for child in page.get('children', []):
                page_nodes.extend(analyze_node(child))
            summary[page_name] = page_nodes
            
    with open('/home/jatoapan/T3-Prolecom/figma_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    print("SUCCESS: Written to figma_summary.json")
except Exception as e:
    print(f"ERROR: {e}")
