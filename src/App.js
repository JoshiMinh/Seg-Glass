import { useEffect, useMemo, useState } from 'react';
import Draggable from 'react-draggable';
import images from './images';

function App() {
  const windowId = useMemo(() => Math.random(), []);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState({ x: window.innerWidth / 4, y: 0 });
  const [imageId, setImageId] = useState(0);
  const [imageList, setImageList] = useState(images);
  const [index, setIndex] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newCensor, setNewCensor] = useState('');
  const [newUncensor, setNewUncensor] = useState('');
  const image1Url = imageList[imageId]?.censor || '';
  const image2Url = imageList[imageId]?.uncensor || '';
  const bc = useMemo(() => new BroadcastChannel('biya'), []);

  const handleOpenNewWindow = () => {
    if (index !== 2) {
      window.open(
        window.location.href,
        '_blank',
        `toolbar=no, menubar=no, location=yes,height=${index === 0 ? window.innerHeight : window.innerHeight / 4},width=${index === 0 ? window.innerWidth : window.innerWidth / 4},scrollbars=no,status=yes`
      );
    } else {
      window.close();
    }
  };

  const updateNewPosition = ({ x, y }) => {
    bc.postMessage({ type: 'update_position', value: { x, y, windowX: window.screenX, windowY: window.screenY } });
    setPosition({ x, y });
  };

  useEffect(() => {
    bc.onmessage = (event) => {
      const { type, value } = event.data;
      if (type === 'new_tab') {
        if (index === 1) {
          bc.postMessage({ type: 'index_2', value });
          updateNewPosition(position);
          bc.postMessage({ type: 'image_id', value: imageId });
        } else {
          bc.postMessage({ type: 'index_1', value });
        }
      } else if (type === 'index_1' && value === windowId) {
        setIndex(1);
        document.title = imageList[imageId]?.title || 'Image';
      } else if (type === 'index_2' && value === windowId) {
        setIndex(2);
        document.title = 'Gương thần';
      } else if (type === 'update_position') {
        const { x, y, windowX, windowY } = value;
        setPosition({ x: windowX + x - window.screenX, y: windowY + y - window.screenY });
      } else if (type === 'image_id') {
        setImageId(value);
      }
    };
    return () => (bc.onmessage = null);
  }, [bc, windowId, index, imageId, position]);

  useEffect(() => {
    let oldX = window.screenX, oldY = window.screenY;
    const update = () => {
      const deltaX = oldX - window.screenX;
      const deltaY = oldY - window.screenY;
      if (deltaX || deltaY) {
        setPosition((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      }
      oldX = window.screenX;
      oldY = window.screenY;
      requestAnimationFrame(update);
    };
    const interval = requestAnimationFrame(update);
    return () => cancelAnimationFrame(interval);
  }, []);

  useEffect(() => {
    bc.postMessage({ type: 'new_tab', value: windowId });
  }, [windowId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([...document.images].filter((img) => !img.complete).map((img) => new Promise((res) => (img.onload = img.onerror = res))))
      .then(() => setLoading(false));
  }, [imageId]);

  const handleAddImage = () => {
    if (!newTitle || !newCensor || !newUncensor) return alert('Please fill in all fields');
    setImageList([...imageList, { title: newTitle, censor: newCensor, uncensor: newUncensor }]);
    setNewTitle('');
    setNewCensor('');
    setNewUncensor('');
  };

  return (
    <>
      {loading && index !== 0 && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-700 opacity-75 z-50">
          <div className="loader border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 rounded-full"></div>
          <h2 className="text-white text-xl font-semibold">Loading...</h2>
          <p className="text-white text-center w-1/3">Please wait...</p>
        </div>
      )}
      <div className="App w-screen h-screen bg-gray-50 dark:bg-gray-800 pt-2">
        <div className="container mx-auto text-center px-1 pt-2">
          {index === 0 ? (
            <>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white uppercase mb-2">Image Viewer</h1>
              <div className="flex flex-col gap-y-2 mb-4">
                <h2 className="text-lg font-bold text-white">Add New Image</h2>
                <input type="text" placeholder="Title" className="border p-2 rounded" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <input type="text" placeholder="Censored Image URL" className="border p-2 rounded" value={newCensor} onChange={(e) => setNewCensor(e.target.value)} />
                <input type="text" placeholder="Uncensored Image URL" className="border p-2 rounded" value={newUncensor} onChange={(e) => setNewUncensor(e.target.value)} />
                <button className="bg-blue-500 text-white px-4 py-2 mt-2 rounded" onClick={handleAddImage}>Add Image</button>
              </div>
            </>
          ) : (
            <select className="bg-gray-50 border text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:text-white" value={imageId} onChange={(e) => { setImageId(e.target.value); bc.postMessage({ type: 'image_id', value: e.target.value }); }}>
              {imageList.map((image, i) => <option key={i} value={i}>{image.title}</option>)}
            </select>
          )}
          <button className="bg-blue-700 text-white px-5 py-2.5 rounded-lg" onClick={handleOpenNewWindow}>{index === 0 ? 'Open Image' : index === 1 ? 'Open Mirror' : 'Close Mirror'}</button>
        </div>
        {index !== 0 && <Draggable position={position}><img className="cursor-move max-w-[900px]" src={index === 2 ? image2Url : image1Url} draggable="false" /></Draggable>}
      </div>
    </>
  );
}
export default App;