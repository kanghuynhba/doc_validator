CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    document_length INTEGER DEFAULT 0,
    num_chunks INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'created',
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL UNIQUE,
    summary_text TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    choice_a TEXT NOT NULL,
    choice_b TEXT NOT NULL,
    choice_c TEXT NOT NULL,
    choice_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    explanation TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL,
    score FLOAT NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS quiz_answers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    quiz_result_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer VARCHAR(1) NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS llm_evaluations (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL UNIQUE,
    summary_rating INTEGER NOT NULL,
    quiz_rating INTEGER NOT NULL,
    feedback TEXT,
    learning_outcome FLOAT NOT NULL,
    llm_performance_score FLOAT NOT NULL,
    performance_label VARCHAR(20) NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS ml_model_runs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    model_type VARCHAR(50) NOT NULL,
    target_name VARCHAR(100) NOT NULL,
    accuracy FLOAT,
    precision_score FLOAT,
    recall_score FLOAT,
    f1_score FLOAT,
    trained_at DATETIME
);
