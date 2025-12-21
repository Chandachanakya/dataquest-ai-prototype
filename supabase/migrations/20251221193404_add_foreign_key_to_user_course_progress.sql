ALTER TABLE user_course_progress
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES profiles(id);