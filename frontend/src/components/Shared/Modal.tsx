import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface BasicModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  description: string;
}

export default function BasicModal({ open, setOpen, title, description }: BasicModalProps) {
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {title}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }} component="div">
            {(() => {
              try {
                const lines = typeof description === 'string' ? description.split('\n') : [];
                return lines.map((line, i) => {
                  if (line.startsWith('Details:')) {
                    const url = line.replace('Details: ', '');
                    return (
                      <div key={i}>
                        Details: <a href={url} style={{ color: '#1976d2' }}>View Event</a>
                      </div>
                    );
                  } else if (line.startsWith('Related Users:')) {
                    const json = line.replace('Related Users: ', '');
                    const users = JSON.parse(json);
                    return (
                      <div key={i}>
                        Related Users:
                        <ul>
                          {users.map((u: any, idx: number) => (
                            <li key={idx}>{u.name}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return <div key={i}>{line}</div>;
                });
              } catch (e) {
                return <div>{description}</div>;
              }
            })()}
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}