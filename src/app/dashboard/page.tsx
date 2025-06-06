'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import { useAuth } from '../context/AuthContext';
import { mealApi, Meal, goalApi, Goal, mealPlanApi } from '../services/api';
import { FaUtensils, FaCalendarAlt, FaHeartbeat, FaBullseye, FaArrowRight, FaEdit, FaTrash } from 'react-icons/fa';
import ProgressBar from '../components/Progress/ProgressBar';
import LearnMore from '../components/LearnMore';
import LoadingIndicator from '../components/LoadingIndicator';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  useEffect(() => {

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchMeals = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const fetchedMeals = await mealApi.getUserMeals(user.id);
        

        const today = new Date().toISOString().split('T')[0]; 
        const todayMeals = fetchedMeals.filter(meal => {

          const mealDate = new Date(meal.meal_date).toISOString().split('T')[0];
          return mealDate === today;
        });
        

        setMeals(todayMeals);

        const calories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const protein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
        const carbs = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
        const fat = todayMeals.reduce((sum, meal) => sum + meal.fat, 0);

        setTotalCalories(calories);
        setTotalProtein(protein);
        setTotalCarbs(carbs);
        setTotalFat(fat);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError('Failed to load meals. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGoals = async () => {
      if (!user) return;

      try {
        setIsGoalsLoading(true);
        const fetchedGoals = await goalApi.getActiveGoals(user.id);
        setActiveGoals(fetchedGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setGoalsError('Failed to load goals');
      } finally {
        setIsGoalsLoading(false);
      }
    };

    fetchMeals();
    fetchGoals();
  }, [isAuthenticated, router, user]);

  const handleDeleteMeal = async (mealId: number) => {
    try {

      if (!user) return;
      
      const mealPlans = await mealPlanApi.getUserMealPlans(user.id);
      const mealPlanReferences = mealPlans.filter(plan => plan.meal_id === mealId);
      

      if (mealPlanReferences.length > 0) {
        const confirmDelete = window.confirm(
          `This meal is being used in ${mealPlanReferences.length} meal plan(s). Deleting it will also remove it from your meal plans. Continue?`
        );
        
        if (!confirmDelete) return;
        
    
        for (const plan of mealPlanReferences) {
          await mealPlanApi.deleteMealPlan(plan.id);
        }
      }
      
      await mealApi.deleteMeal(mealId);
      

      setMeals(prevMeals => {
        const updatedMeals = prevMeals.filter(meal => meal.id !== mealId);

        const calories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const protein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);
        const carbs = updatedMeals.reduce((sum, meal) => sum + meal.carbs, 0);
        const fat = updatedMeals.reduce((sum, meal) => sum + meal.fat, 0);

        setTotalCalories(calories);
        setTotalProtein(protein);
        setTotalCarbs(carbs);
        setTotalFat(fat);
        
        return updatedMeals;
      });
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again later.');
    }
  };

  const formatDateInUTC = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className={styles.dashboardContainer}>
      <section className={styles.dashboardHeader}>
        <h1 className={styles.welcomeMessage}>Welcome back, {user?.username || 'User'}!</h1>
        <p className={styles.dateDisplay}>
          {formatDateInUTC()}
        </p>
      </section>

      {/* Quick Access Section */}
      <section className={styles.quickAccessSection}>
        <h2 className={styles.sectionTitle}>Quick Access</h2>
        <div className={styles.quickAccessGrid}>
          <Link href="/meals/add" className={styles.quickAccessCard}>
            <div className={styles.quickAccessIcon}>
              <FaUtensils />
            </div>
            <div className={styles.quickAccessContent}>
              <h3>Add Meal</h3>
              <p>Log your latest meal</p>
            </div>
          </Link>
          
          <Link href="/dashboard/meal-plans" className={styles.quickAccessCard}>
            <div className={styles.quickAccessIcon}>
              <FaCalendarAlt />
            </div>
            <div className={styles.quickAccessContent}>
              <h3>Meal Plans</h3>
              <p>View or create meal plans</p>
            </div>
          </Link>
          
          <Link href="/dashboard/goals" className={styles.quickAccessCard}>
            <div className={styles.quickAccessIcon}>
              <FaBullseye />
            </div>
            <div className={styles.quickAccessContent}>
              <h3>Goal Setting</h3>
              <p>Track your health goals</p>
            </div>
          </Link>
          
          <Link href="/dashboard/health-tracking" className={styles.quickAccessCard}>
            <div className={styles.quickAccessIcon}>
              <FaHeartbeat />
            </div>
            <div className={styles.quickAccessContent}>
              <h3>Health Tracking</h3>
              <p>Monitor your health metrics</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Active Goals Section */}
      <section className={styles.activeGoalsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Goals</h2>
          <Link href="/dashboard/goals" className={styles.viewAllLink}>
            View All <FaArrowRight className={styles.viewAllIcon} />
          </Link>
        </div>

        {isGoalsLoading ? (
          <LoadingIndicator text="Loading your goals..." />
        ) : goalsError ? (
          <div className={styles.errorState}>{goalsError}</div>
        ) : activeGoals.length > 0 ? (
          <div className={styles.goalsList}>
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <div className={styles.goalCategory}>{goal.category}</div>
                  <div className={styles.goalStatus}>{goal.status}</div>
                </div>
                <h3 className={styles.goalTitle}>{goal.title}</h3>
                <p className={styles.goalDescription}>{goal.description}</p>
                {goal.target_value && goal.current_value && (
                  <div className={styles.goalProgress}>
                    <ProgressBar 
                      currentValue={goal.current_value}
                      maxValue={goal.target_value}
                      unit={goal.unit}
                    />
                  </div>
                )}
                <div className={styles.goalDates}>
                  <div className={styles.goalDate}>
                    <span>Start:</span> {new Date(goal.start_date).toLocaleDateString()}
                  </div>
                  <div className={styles.goalDate}>
                    <span>Target:</span> {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>You haven't set any goals yet.</p>
            <Link href="/dashboard/goals" className="btn btn-primary">
              Set Your First Goal
            </Link>
          </div>
        )}
      </section>
      <section className={styles.moreFeaturesSection}>
        <LearnMore 
          title="Discover More Diet Time Features"
          description="Explore our comprehensive suite of tools designed to help you achieve your health and nutrition goals."
          linkUrl="/features"
          linkText="Explore All Features"
        />
      </section>
    </div>
  );
}