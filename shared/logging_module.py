import logging
import os 

from shared.configs import PROJECT_ROOT

class Logger:
  def __init__(self, log_file: str, level=logging.INFO):
    log_dir = os.path.join(PROJECT_ROOT, "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    self.log_path = os.path.join(log_dir, log_file)
    self.logger = logging.getLogger(log_file)
    
    if not self.logger.hasHandlers():
      self.logger.setLevel(level)
      formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

      file_handler = logging.FileHandler(self.log_path)
      file_handler.setFormatter(formatter)
      self.logger.addHandler(file_handler)
    
  def start_batch(self, batch_name: str):
    self.logger.info(f"START batch: {batch_name}")

  def end_batch(self, batch_name: str, duration: float, avg_per_item: float = None):
    msg = f"END batch: {batch_name} | total_duration={duration:.2f}s"
    if avg_per_item is not None:
      msg += f" | average_time_per_item={avg_per_item:.2f}s"
    self.logger.info(msg)

  def start_item(self, item_name: str):
    self.logger.info(f"START processing item: {item_name}")

  def end_item(self, item_name: str, duration: float):
    self.logger.info(f"END processing item: {item_name} | duration={duration:.2f}s")

  def log_response(self, item_name: str, content: str):
    self.logger.info(f"RESPONSE for {item_name}:\n\n{content.strip()}")

  def info(self, message: str):
    self.logger.info(message)

  def error(self, message: str):
    self.logger.error(message)
    
  def warning(self, message: str):
    self.logger.warning(message)
    
  def debug(self, message: str):
    self.logger.debug(message)