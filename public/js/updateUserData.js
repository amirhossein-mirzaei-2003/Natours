import axios from 'axios';
import { showAlert } from './alert';

// type: 'data', 'password'
const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const result = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (result.data.status === 'success') {
      showAlert('success', 'settings updated!');
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export default updateSettings;
