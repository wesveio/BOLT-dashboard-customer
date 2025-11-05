/**
 * Enhanced Abandonment Predictor Model
 * 
 * Advanced ML-based prediction model with historical data training
 */

import { AbandonmentPredictor as BasePredictor } from '../prediction-models';
import { PredictionFeatures, AbandonmentPrediction } from '../types';

export interface HistoricalTrainingData {
  sessionId: string;
  features: PredictionFeatures;
  outcome: 'completed' | 'abandoned';
  timestamp: Date;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  trainingSize: number;
}

export class EnhancedAbandonmentPredictor extends BasePredictor {
  private trainingData: HistoricalTrainingData[] = [];
  private modelMetrics: ModelMetrics | null = null;
  private predictionHistory: Map<string, AbandonmentPrediction[]> = new Map();

  /**
   * Train model with historical data
   */
  train(data: HistoricalTrainingData[]): void {
    if (data.length === 0) {
      console.warn('⚠️ [DEBUG] No training data provided');
      return;
    }

    this.trainingData = [...data];
    
    // Calculate model metrics
    const metrics = this.calculateMetrics(data);
    this.modelMetrics = {
      ...metrics,
      lastTrained: new Date(),
      trainingSize: data.length,
    };

    console.info(`✅ [DEBUG] Model trained with ${data.length} samples. Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  }

  /**
   * Predict with enhanced features including historical context
   */
  predict(
    features: PredictionFeatures,
    sessionId?: string
  ): AbandonmentPrediction {
    // Get base prediction
    const basePrediction = super.predict(features);

    // Enhance with historical context if session ID provided
    if (sessionId && this.predictionHistory.has(sessionId)) {
      const history = this.predictionHistory.get(sessionId)!;
      const enhancedPrediction = this.enhanceWithHistory(basePrediction, history);
      
      // Store prediction in history
      history.push(enhancedPrediction);
      if (history.length > 10) {
        history.shift(); // Keep only last 10 predictions
      }
      
      return enhancedPrediction;
    }

    // Store prediction if session ID provided
    if (sessionId) {
      if (!this.predictionHistory.has(sessionId)) {
        this.predictionHistory.set(sessionId, []);
      }
      this.predictionHistory.get(sessionId)!.push(basePrediction);
    }

    return basePrediction;
  }

  /**
   * Enhance prediction with historical context
   */
  private enhanceWithHistory(
    prediction: AbandonmentPrediction,
    history: AbandonmentPrediction[]
  ): AbandonmentPrediction {
    if (history.length === 0) {
      return prediction;
    }

    // Calculate trend (increasing risk = bad sign)
    const recentScores = history.slice(-3).map((p) => p.riskScore);
    const avgRecentScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    // If risk is increasing, boost the score
    if (prediction.riskScore > avgRecentScore && prediction.riskScore > 50) {
      const boost = Math.min(10, (prediction.riskScore - avgRecentScore) * 0.2);
      prediction.riskScore = Math.min(100, prediction.riskScore + boost);
      
      // Update risk level if needed
      if (prediction.riskScore >= 70 && prediction.riskLevel !== 'critical') {
        prediction.riskLevel = 'critical';
      } else if (prediction.riskScore >= 50 && prediction.riskLevel === 'low') {
        prediction.riskLevel = 'high';
      }
    }

    // Adjust confidence based on history consistency
    const consistentPredictions = history.filter(
      (p) => Math.abs(p.riskScore - prediction.riskScore) < 15
    ).length;
    
    const consistencyRatio = consistentPredictions / history.length;
    prediction.confidence = Math.min(1, prediction.confidence + (consistencyRatio * 0.1));

    return prediction;
  }

  /**
   * Calculate model metrics from training data
   */
  private calculateMetrics(data: HistoricalTrainingData[]): Omit<ModelMetrics, 'lastTrained' | 'trainingSize'> {
    let truePositives = 0; // Predicted high risk, actually abandoned
    let falsePositives = 0; // Predicted high risk, actually completed
    let trueNegatives = 0; // Predicted low risk, actually completed
    let falseNegatives = 0; // Predicted low risk, actually abandoned

    data.forEach((sample) => {
      const prediction = super.predict(sample.features);
      const isHighRisk = prediction.riskScore >= 50;
      const actuallyAbandoned = sample.outcome === 'abandoned';

      if (isHighRisk && actuallyAbandoned) {
        truePositives++;
      } else if (isHighRisk && !actuallyAbandoned) {
        falsePositives++;
      } else if (!isHighRisk && !actuallyAbandoned) {
        trueNegatives++;
      } else {
        falseNegatives++;
      }
    });

    const total = data.length;
    const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    const f1Score = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
    };
  }

  /**
   * Get model metrics
   */
  getMetrics(): ModelMetrics | null {
    return this.modelMetrics;
  }

  /**
   * Load training data from database
   */
  async loadTrainingDataFromDatabase(
    fetchFunction: (limit: number) => Promise<HistoricalTrainingData[]>
  ): Promise<void> {
    try {
      const data = await fetchFunction(1000); // Load last 1000 samples
      if (data.length > 0) {
        this.train(data);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading training data:', error);
    }
  }

  /**
   * Retrain model periodically
   */
  async retrainModel(
    fetchFunction: (limit: number) => Promise<HistoricalTrainingData[]>,
    intervalMs: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<void> {
    const train = async () => {
      try {
        await this.loadTrainingDataFromDatabase(fetchFunction);
      } catch (error) {
        console.error('❌ [DEBUG] Error retraining model:', error);
      }
    };

    // Train immediately
    await train();

    // Set up periodic retraining
    setInterval(train, intervalMs);
  }

  /**
   * Clear prediction history for a session
   */
  clearSessionHistory(sessionId: string): void {
    this.predictionHistory.delete(sessionId);
  }

  /**
   * Get prediction history for a session
   */
  getSessionHistory(sessionId: string): AbandonmentPrediction[] {
    return this.predictionHistory.get(sessionId) || [];
  }
}

